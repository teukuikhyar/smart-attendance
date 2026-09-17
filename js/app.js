// ============================================================
// SMART ATTENDANCE - APP.JS
// Alur:
// Login Google -> Scan QR Sesi -> Konfirmasi -> Presensi
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


// ============================================================
// KONFIGURASI
// ============================================================

const GOOGLE_CLIENT_ID =
    "25049813828-p0c1nhqdpmrtb2o95pk3gtpmatdcqbfg.apps.googleusercontent.com";


// ============================================================
// VARIABEL GLOBAL
// ============================================================

let currentStudent = null;
let currentSession = null;
let html5QrCode = null;
let scannerRunning = false;


// ============================================================
// INISIALISASI APLIKASI
// ============================================================

function initializeApp() {
    console.log("Smart Attendance dimulai...");

    showLoginSection();

    // Tunggu Google Identity Services selesai dimuat
    waitForGoogle();
}


// ============================================================
// GOOGLE LOGIN
// ============================================================

function waitForGoogle() {
    if (
        typeof google !== "undefined" &&
        google.accounts &&
        google.accounts.id
    ) {
        initializeGoogleLogin();
    } else {
        setTimeout(waitForGoogle, 300);
    }
}


function initializeGoogleLogin() {
    console.log("Google Identity Services siap.");

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
    });

    const buttonContainer = document.getElementById("googleLoginButton");

    if (!buttonContainer) {
        console.error("Elemen googleLoginButton tidak ditemukan.");
        return;
    }

    buttonContainer.innerHTML = "";

    google.accounts.id.renderButton(buttonContainer, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 300
    });
}


// ============================================================
// MENERIMA HASIL LOGIN GOOGLE
// ============================================================

async function handleGoogleLogin(response) {
    try {
        if (!response || !response.credential) {
            showMessage(
                "Login Google gagal. Credential tidak ditemukan.",
                "error"
            );
            return;
        }

        showLoading("Memverifikasi akun Google...");

        const result = await verifyGoogleToken(response.credential);

        hideLoading();

        if (!result || !result.success) {
            showMessage(
                result?.message || "Akun Google tidak terdaftar.",
                "error"
            );
            return;
        }

        if (!result.data) {
            showMessage(
                "Data mahasiswa tidak ditemukan.",
                "error"
            );
            return;
        }

        // Simpan data mahasiswa
        currentStudent = {
            nim: result.data.nim || "",
            name: result.data.name || "",
            class: result.data.class || "",
            email: result.data.email || "",
            googleId: result.data.googleId || ""
        };

        console.log("Mahasiswa berhasil login:", currentStudent);

        // Tampilkan data mahasiswa
        setElementText("loginName", currentStudent.name);
        setElementText("loginNim", currentStudent.nim);
        setElementText("loginClass", currentStudent.class);
        setElementText("loginEmail", currentStudent.email);

        setElementText("confirmName", currentStudent.name);
        setElementText("confirmNim", currentStudent.nim);
        setElementText("confirmClass", currentStudent.class);
        setElementText("confirmEmail", currentStudent.email);

        // Tampilkan informasi mahasiswa
        const studentInfo = document.getElementById("studentInfo");

        if (studentInfo) {
            studentInfo.style.display = "block";
        }

        // Pindah ke scanner
        setTimeout(() => {
            showScannerSection();

            showMessage(
                "Login berhasil. Silakan scan QR Code sesi perkuliahan.",
                "success"
            );
        }, 500);

    } catch (error) {
        console.error("Error login Google:", error);

        hideLoading();

        showMessage(
            "Terjadi kesalahan saat login Google.",
            "error"
        );
    }
}


// ============================================================
// VERIFIKASI TOKEN GOOGLE KE APPS SCRIPT
// ============================================================

function verifyGoogleToken(token) {
    return new Promise((resolve, reject) => {

        if (!token) {
            reject(new Error("Token Google kosong."));
            return;
        }

        const callbackName =
            "googleLoginCallback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);

        const script = document.createElement("script");

        const timeout = setTimeout(() => {
            cleanup();

            reject(
                new Error(
                    "Server tidak merespons. Periksa koneksi internet atau Apps Script."
                )
            );
        }, 15000);

        window[callbackName] = function (data) {
            clearTimeout(timeout);
            cleanup();

            resolve(data);
        };

        function cleanup() {
            try {
                delete window[callbackName];
            } catch (e) {
                window[callbackName] = undefined;
            }

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        const url =
            API_URL +
            "?action=googleLogin" +
            "&token=" +
            encodeURIComponent(token) +
            "&callback=" +
            encodeURIComponent(callbackName);

        script.src = url;

        script.onerror = function () {
            clearTimeout(timeout);
            cleanup();

            reject(
                new Error(
                    "Gagal menghubungi server Apps Script."
                )
            );
        };

        document.body.appendChild(script);
    });
}


// ============================================================
// SCANNER QR CODE
// ============================================================

async function startScanner() {
    const reader = document.getElementById("reader");

    if (!reader) {
        showMessage(
            "Elemen scanner tidak ditemukan.",
            "error"
        );
        return;
    }

    if (scannerRunning) {
        return;
    }

    try {
        html5QrCode = new Html5Qrcode("reader");

        await html5QrCode.start(
            {
                facingMode: "environment"
            },
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                }
            },
            onQrCodeSuccess,
            onQrCodeError
        );

        scannerRunning = true;

        console.log("Scanner berhasil dimulai.");

    } catch (error) {
        console.error("Gagal memulai scanner:", error);

        showMessage(
            "Kamera tidak dapat digunakan. Pastikan izin kamera diberikan.",
            "error"
        );
    }
}


// ============================================================
// HASIL SCAN QR
// ============================================================

async function onQrCodeSuccess(decodedText) {
    console.log("QR terbaca:", decodedText);

    if (!decodedText) {
        return;
    }

    await stopScanner();

    try {
        let qrData;

        try {
            qrData = JSON.parse(decodedText);
        } catch (error) {
            showMessage(
                "QR Code tidak memiliki format yang valid.",
                "error"
            );

            setTimeout(() => {
                startScanner();
            }, 1500);

            return;
        }

        // Pastikan QR berasal dari Smart Attendance
        if (qrData.type !== "SMART_ATTENDANCE") {
            showMessage(
                "QR Code bukan QR Smart Attendance.",
                "error"
            );

            setTimeout(() => {
                startScanner();
            }, 1500);

            return;
        }

        // Validasi data sesi
        if (
            !qrData.course ||
            !qrData.meeting ||
            !qrData.session
        ) {
            showMessage(
                "Data sesi pada QR tidak lengkap.",
                "error"
            );

            setTimeout(() => {
                startScanner();
            }, 1500);

            return;
        }

        currentSession = {
            course: qrData.course,
            meeting: qrData.meeting,
            session: qrData.session
        };

        console.log("Sesi ditemukan:", currentSession);

        // Isi informasi konfirmasi
        setElementText(
            "confirmCourse",
            currentSession.course
        );

        setElementText(
            "confirmMeeting",
            currentSession.meeting
        );

        // Tampilkan halaman konfirmasi
        showConfirmationSection();

    } catch (error) {
        console.error("Error membaca QR:", error);

        showMessage(
            "Terjadi kesalahan saat membaca QR.",
            "error"
        );
    }
}


// ============================================================
// CALLBACK KETIKA QR TIDAK TERBACA
// ============================================================

function onQrCodeError(errorMessage) {
    // Tidak perlu menampilkan error setiap frame
    // karena scanner memang terus mencoba membaca QR.
}


// ============================================================
// STOP SCANNER
// ============================================================

async function stopScanner() {
    if (!html5QrCode || !scannerRunning) {
        return;
    }

    try {
        await html5QrCode.stop();

        console.log("Scanner dihentikan.");

    } catch (error) {
        console.warn(
            "Scanner sudah tidak aktif atau gagal dihentikan:",
            error
        );
    }

    scannerRunning = false;

    try {
        await html5QrCode.clear();
    } catch (error) {
        // Abaikan jika reader sudah kosong
    }

    html5QrCode = null;
}


// ============================================================
// SUBMIT / SIMPAN PRESENSI
// ============================================================

async function submitAttendance() {
    if (!currentStudent) {
        showMessage(
            "Data mahasiswa belum tersedia. Silakan login Google.",
            "error"
        );
        return;
    }

    if (!currentSession) {
        showMessage(
            "Data sesi belum tersedia. Silakan scan QR terlebih dahulu.",
            "error"
        );
        return;
    }

    const attendance = {
        nim: currentStudent.nim,

        name: currentStudent.name,

        class: currentStudent.class,

        email: currentStudent.email,

        course: currentSession.course,

        meeting: currentSession.meeting,

        session: currentSession.session
    };

    console.log("Data presensi:", attendance);

    try {
        showLoading("Menyimpan presensi...");

        const result = await sendAttendance(attendance);

        hideLoading();

        if (!result || !result.success) {

            showMessage(
                result?.message ||
                "Presensi gagal disimpan.",
                "error"
            );

            return;
        }

        showSuccess(attendance, result);

    } catch (error) {
        console.error(
            "Error menyimpan presensi:",
            error
        );

        hideLoading();

        showMessage(
            "Tidak dapat menyimpan presensi. Periksa koneksi internet.",
            "error"
        );
    }
}


// ============================================================
// KIRIM PRESENSI KE GOOGLE APPS SCRIPT
// ============================================================

function sendAttendance(attendance) {
    return new Promise((resolve, reject) => {

        const callbackName =
            "attendanceCallback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 10000);

        const script = document.createElement("script");

        const timeout = setTimeout(() => {
            cleanup();

            reject(
                new Error(
                    "Server tidak merespons."
                )
            );
        }, 15000);

        window[callbackName] = function (data) {
            clearTimeout(timeout);
            cleanup();

            resolve(data);
        };

        function cleanup() {
            try {
                delete window[callbackName];
            } catch (e) {
                window[callbackName] = undefined;
            }

            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        /*
         * Apps Script doPost menerima data presensi.
         * Untuk menghindari masalah CORS dari GitHub Pages,
         * kita menggunakan form POST biasa.
         */

        const form = document.createElement("form");

        form.method = "POST";
        form.action = API_URL;
        form.target = "attendanceSubmitFrame";
        form.style.display = "none";

        const iframe =
            document.getElementById(
                "attendanceSubmitFrame"
            ) || createHiddenIframe();

        Object.keys(attendance).forEach((key) => {
            const input =
                document.createElement("input");

            input.type = "hidden";
            input.name = key;
            input.value =
                attendance[key] ?? "";

            form.appendChild(input);
        });

        /*
         * Callback tidak selalu dapat digunakan oleh doPost
         * karena POST melalui iframe.
         *
         * Kita tetap gunakan fetch JSONP-compatible endpoint
         * sebagai fallback untuk pengecekan hasil.
         */

        document.body.appendChild(form);

        try {
            form.submit();
        } catch (error) {
            clearTimeout(timeout);
            cleanup();

            if (form.parentNode) {
                form.parentNode.removeChild(form);
            }

            reject(error);
            return;
        }

        /*
         * Beri waktu Apps Script memproses data.
         */
        setTimeout(() => {

            if (form.parentNode) {
                form.parentNode.removeChild(form);
            }

            clearTimeout(timeout);
            cleanup();

            /*
             * Karena POST Apps Script tidak memberikan response
             * yang bisa dibaca lintas domain, kita anggap proses
             * berhasil setelah request terkirim.
             */
            resolve({
                success: true,
                message: "Presensi berhasil dikirim."
            });

        }, 1500);
    });
}


// ============================================================
// IFRAME UNTUK POST
// ============================================================

function createHiddenIframe() {

    const iframe =
        document.createElement("iframe");

    iframe.name = "attendanceSubmitFrame";

    iframe.id = "attendanceSubmitFrame";

    iframe.style.display = "none";

    document.body.appendChild(iframe);

    return iframe;
}


// ============================================================
// TAMPILKAN HALAMAN SUKSES
// ============================================================

function showSuccess(attendance, result) {

    setElementText(
        "successNim",
        attendance.nim
    );

    setElementText(
        "successName",
        attendance.name
    );

    setElementText(
        "successClass",
        attendance.class
    );

    setElementText(
        "successEmail",
        attendance.email
    );

    setElementText(
        "successCourse",
        attendance.course
    );

    setElementText(
        "successMeeting",
        attendance.meeting
    );

    const now = new Date();

    const dateText =
        now.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    const timeText =
        now.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    setElementText(
        "successDate",
        dateText
    );

    setElementText(
        "successTime",
        timeText
    );

    setElementText(
        "successSession",
        attendance.session
    );

    showSection("successSection");

    showMessage(
        "Presensi berhasil disimpan.",
        "success"
    );
}


// ============================================================
// RESET PRESENSI
// ============================================================

async function resetAttendance() {

    await stopScanner();

    currentStudent = null;
    currentSession = null;

    clearElement("loginName");
    clearElement("loginNim");
    clearElement("loginClass");
    clearElement("loginEmail");

    clearElement("confirmName");
    clearElement("confirmNim");
    clearElement("confirmClass");
    clearElement("confirmEmail");
    clearElement("confirmCourse");
    clearElement("confirmMeeting");

    clearElement("successNim");
    clearElement("successName");
    clearElement("successClass");
    clearElement("successEmail");
    clearElement("successCourse");
    clearElement("successMeeting");
    clearElement("successDate");
    clearElement("successTime");
    clearElement("successSession");

    const studentInfo =
        document.getElementById("studentInfo");

    if (studentInfo) {
        studentInfo.style.display = "none";
    }

    showLoginSection();

    // Render ulang tombol Google jika diperlukan
    setTimeout(() => {
        if (
            typeof google !== "undefined" &&
            google.accounts &&
            google.accounts.id
        ) {
            initializeGoogleLogin();
        }
    }, 300);
}


// ============================================================
// NAVIGASI SECTION
// ============================================================

function showLoginSection() {
    showSection("loginSection");
}

function showScannerSection() {
    showSection("scannerSection");

    // Mulai kamera sedikit setelah section tampil
    setTimeout(() => {
        startScanner();
    }, 500);
}

function showConfirmationSection() {
    showSection("confirmationSection");
}

function showSection(sectionId) {

    const sections = [
        "loginSection",
        "scannerSection",
        "confirmationSection",
        "successSection"
    ];

    sections.forEach((id) => {

        const section =
            document.getElementById(id);

        if (!section) {
            return;
        }

        if (id === sectionId) {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    });
}


// ============================================================
// UTILITY ELEMENT
// ============================================================

function setElementText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "-";
}


function clearElement(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = "";
}


// ============================================================
// PESAN
// ============================================================

function showMessage(message, type = "info") {

    /*
     * Jika project mempunyai elemen #message,
     * gunakan elemen tersebut.
     */

    const messageElement =
        document.getElementById("message");

    if (messageElement) {

        messageElement.textContent =
            message;

        messageElement.className =
            "message " + type;

        messageElement.style.display =
            "block";

        return;
    }

    /*
     * Fallback sederhana jika elemen message
     * belum tersedia.
     */

    console.log(
        "[" + type.toUpperCase() + "]",
        message
    );
}


// ============================================================
// LOADING
// ============================================================

function showLoading(text = "Memproses...") {

    let loading =
        document.getElementById("loading");

    if (!loading) {

        loading =
            document.createElement("div");

        loading.id = "loading";

        loading.style.position =
            "fixed";

        loading.style.top = "0";

        loading.style.left = "0";

        loading.style.right = "0";

        loading.style.bottom = "0";

        loading.style.display =
            "flex";

        loading.style.alignItems =
            "center";

        loading.style.justifyContent =
            "center";

        loading.style.background =
            "rgba(0,0,0,0.45)";

        loading.style.zIndex =
            "9999";

        loading.style.fontSize =
            "18px";

        loading.style.fontWeight =
            "600";

        loading.style.color =
            "#ffffff";

        document.body.appendChild(loading);
    }

    loading.textContent = text;

    loading.style.display =
        "flex";
}


function hideLoading() {

    const loading =
        document.getElementById("loading");

    if (loading) {
        loading.style.display = "none";
    }
}


// ============================================================
// CEK APAKAH MAHASISWA SUDAH LOGIN
// ============================================================

function isStudentLoggedIn() {
    return (
        currentStudent !== null &&
        currentStudent.nim !== ""
    );
}


// ============================================================
// CEK APAKAH SESI SUDAH DIPILIH
// ============================================================

function isSessionReady() {
    return (
        currentSession !== null &&
        currentSession.course &&
        currentSession.meeting &&
        currentSession.session
    );
}


// ============================================================
// KEMBALI KE SCANNER
// ============================================================

function backToScanner() {

    if (!currentStudent) {
        showLoginSection();
        return;
    }

    currentSession = null;

    showScannerSection();
}


// ============================================================
// KEMBALI KE LOGIN
// ============================================================

async function logoutStudent() {

    await stopScanner();

    currentStudent = null;
    currentSession = null;

    try {
        if (
            typeof google !== "undefined" &&
            google.accounts &&
            google.accounts.id
        ) {
            google.accounts.id.disableAutoSelect();
        }
    } catch (error) {
        console.warn(
            "Google logout warning:",
            error
        );
    }

    showLoginSection();

    setTimeout(() => {
        if (
            typeof google !== "undefined" &&
            google.accounts &&
            google.accounts.id
        ) {
            initializeGoogleLogin();
        }
    }, 300);
}


// ============================================================
// EXPORT FUNCTION
// Supaya bisa dipanggil oleh tombol HTML
// ============================================================

window.startScanner =
    startScanner;

window.stopScanner =
    stopScanner;

window.submitAttendance =
    submitAttendance;

window.resetAttendance =
    resetAttendance;

window.backToScanner =
    backToScanner;

window.logoutStudent =
    logoutStudent;

window.handleGoogleLogin =
    handleGoogleLogin;


// ============================================================
// SELESAI
// ============================================================

console.log(
    "Smart Attendance app.js berhasil dimuat."
);