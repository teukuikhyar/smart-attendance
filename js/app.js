// ======================================================
// SMART ATTENDANCE - APP.JS
// ======================================================

// ======================================================
// DATA GLOBAL
// ======================================================

let currentStudent = null;
let currentSession = null;

let html5QrCode = null;
let isScannerRunning = false;


// ======================================================
// DATA DEMO
// ======================================================

const demoStudents = {

    "230101001": {
        nim: "230101001",
        name: "Teuku Ikhyar",
        class: "TI-3A"
    },

    "230101002": {
        nim: "230101002",
        name: "Muhammad Rizki",
        class: "TI-3A"
    },

    "230101003": {
        nim: "230101003",
        name: "Siti Aisyah",
        class: "TI-3A"
    },

    "230101004": {
        nim: "230101004",
        name: "Fajar Maulana",
        class: "TI-3A"
    }

};


// ======================================================
// HELPER ELEMENT
// ======================================================

function getElement(id) {

    return document.getElementById(id);

}


// ======================================================
// MENAMPILKAN SECTION
// ======================================================

function showSection(sectionId) {

    const sections = [

        "nimSection",
        "scannerSection",
        "confirmationSection",
        "successSection"

    ];


    sections.forEach(id => {

        const element = getElement(id);

        if (element) {

            element.style.display = "none";

        }

    });


    const target = getElement(sectionId);


    if (target) {

        target.style.display = "block";

    }

}


// ======================================================
// SAAT HALAMAN SELESAI DIMUAT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        showSection("nimSection");


        const nimInput =
            getElement("nimInput");


        if (nimInput) {

            nimInput.focus();


            nimInput.addEventListener(
                "keypress",
                function (event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        startAttendance();

                    }

                }
            );

        }


        const continueBtn =
            getElement("continueBtn");


        if (continueBtn) {

            continueBtn.addEventListener(
                "click",
                startAttendance
            );

        }


        const submitBtn =
            getElement("submitBtn");


        if (submitBtn) {

            submitBtn.addEventListener(
                "click",
                submitAttendance
            );

        }


        const resetBtn =
            getElement("resetBtn");


        if (resetBtn) {

            resetBtn.addEventListener(
                "click",
                resetAttendance
            );

        }

    }
);


// ======================================================
// JSONP
// MENGAMBIL DATA MAHASISWA DARI GOOGLE SHEETS
// ======================================================

function getStudentFromGoogleSheets(nim) {

    return new Promise(
        (resolve, reject) => {

            const callbackName =
                "studentCallback_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 1000
                );


            const script =
                document.createElement(
                    "script"
                );


            let finished = false;


            const timeout =
                setTimeout(
                    function () {

                        if (finished) {
                            return;
                        }


                        finished = true;

                        cleanup();


                        reject(
                            new Error(
                                "Waktu permintaan data mahasiswa habis."
                            )
                        );

                    },
                    15000
                );


            window[callbackName] =
                function (result) {

                    if (finished) {
                        return;
                    }


                    finished = true;

                    clearTimeout(timeout);

                    cleanup();


                    resolve(result);

                };


            function cleanup() {

                clearTimeout(timeout);


                if (
                    script &&
                    script.parentNode
                ) {

                    script.parentNode
                        .removeChild(script);

                }


                try {

                    delete window[
                        callbackName
                    ];

                } catch (error) {

                    window[
                        callbackName
                    ] = undefined;

                }

            }


            script.onerror =
                function () {

                    if (finished) {
                        return;
                    }


                    finished = true;

                    clearTimeout(timeout);

                    cleanup();


                    reject(
                        new Error(
                            "Gagal menghubungi Google Apps Script."
                        )
                    );

                };


            script.src =
                API_URL +
                "?action=student" +
                "&nim=" +
                encodeURIComponent(nim) +
                "&callback=" +
                encodeURIComponent(
                    callbackName
                );


            console.log(
                "Meminta data mahasiswa:",
                script.src
            );


            document.body.appendChild(
                script
            );

        }
    );

}


// ======================================================
// STEP 1
// MEMERIKSA NIM
// ======================================================

async function startAttendance() {

    const nimInput =
        getElement("nimInput");


    if (!nimInput) {

        alert(
            "Input NIM tidak ditemukan."
        );

        return;

    }


    const nim =
        nimInput.value.trim();


    // --------------------------------------------------
    // VALIDASI NIM
    // --------------------------------------------------

    if (!nim) {

        alert(
            "Silakan masukkan NIM terlebih dahulu."
        );

        nimInput.focus();

        return;

    }


    // --------------------------------------------------
    // MODE DEMO
    // --------------------------------------------------

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE === true
    ) {

        const student =
            demoStudents[nim];


        if (!student) {

            alert(
                "NIM tidak ditemukan pada data demo."
            );

            return;

        }


        currentStudent = {

            nim:
                student.nim,

            name:
                student.name,

            class:
                student.class

        };


        console.log(
            "Mahasiswa Demo:",
            currentStudent
        );


        showScanner();


        return;

    }


    // --------------------------------------------------
    // VALIDASI API
    // --------------------------------------------------

    if (
        typeof API_URL === "undefined" ||
        !API_URL
    ) {

        alert(
            "API_URL belum dikonfigurasi.\n\n" +
            "Periksa file js/config.js."
        );

        return;

    }


    const continueBtn =
        getElement("continueBtn");


    if (continueBtn) {

        continueBtn.disabled = true;

        continueBtn.innerText =
            "Memeriksa...";

    }


    try {

        // ------------------------------------------------
        // AMBIL DATA MAHASISWA
        // ------------------------------------------------

        const result =
            await getStudentFromGoogleSheets(
                nim
            );


        console.log(
            "Response mahasiswa:",
            result
        );


        // ------------------------------------------------
        // CEK DATA
        // ------------------------------------------------

        if (
            result &&
            result.success === true &&
            result.data
        ) {

            currentStudent = {

                nim:
                    result.data.nim || nim,

                name:
                    result.data.name ||
                    "Mahasiswa",

                class:
                    result.data.class ||
                    ""

            };


            console.log(
                "Mahasiswa ditemukan:",
                currentStudent
            );


            // Lanjut ke scanner
            showScanner();


        } else {

            const message =
                result &&
                result.message
                    ? result.message
                    : "NIM tidak ditemukan di Google Sheets.";


            alert(message);

        }


    } catch (error) {

        console.error(
            "Gagal mengambil data mahasiswa:",
            error
        );


        alert(
            "Gagal mengambil data mahasiswa dari Google Sheets.\n\n" +
            "Pastikan:\n" +
            "1. API_URL benar.\n" +
            "2. Web App Apps Script sudah dideploy.\n" +
            "3. Akses Web App diset ke Anyone.\n" +
            "4. Koneksi internet aktif.\n\n" +
            "Detail: " +
            error.message
        );

    } finally {

        if (continueBtn) {

            continueBtn.disabled = false;

            continueBtn.innerText =
                "Lanjutkan";

        }

    }

}


// ======================================================
// STEP 2
// MENAMPILKAN SCANNER
// ======================================================

async function showScanner() {

    if (!currentStudent) {

        alert(
            "Data mahasiswa belum tersedia."
        );

        return;

    }


    updateStudentInformation();


    showSection(
        "scannerSection"
    );


    await startScanner();

}


// ======================================================
// UPDATE INFORMASI MAHASISWA
// ======================================================

function updateStudentInformation() {

    const studentName =
        getElement("studentName");


    const studentNim =
        getElement("studentNim");


    const studentClass =
        getElement("studentClass");


    if (studentName) {

        studentName.innerText =
            currentStudent.name;

    }


    if (studentNim) {

        studentNim.innerText =
            currentStudent.nim;

    }


    if (studentClass) {

        studentClass.innerText =
            currentStudent.class || "-";

    }

}


// ======================================================
// MEMULAI SCANNER
// ======================================================

async function startScanner() {

    const reader =
        getElement("reader");


    if (!reader) {

        alert(
            "Area scanner (#reader) tidak ditemukan."
        );

        return;

    }


    reader.innerHTML = "";


    // --------------------------------------------------
    // HENTIKAN SCANNER LAMA
    // --------------------------------------------------

    if (
        html5QrCode &&
        isScannerRunning
    ) {

        try {

            await stopScanner();

        } catch (error) {

            console.warn(
                "Gagal menghentikan scanner lama:",
                error
            );

        }

    }


    // --------------------------------------------------
    // CEK LIBRARY
    // --------------------------------------------------

    if (
        typeof Html5Qrcode ===
        "undefined"
    ) {

        alert(
            "Library QR Scanner belum tersedia."
        );

        return;

    }


    try {

        html5QrCode =
            new Html5Qrcode(
                "reader"
            );


        const config = {

            fps: 10,

            qrbox: {

                width: 250,
                height: 250

            },

            aspectRatio: 1.0

        };


        await html5QrCode.start(

            {
                facingMode:
                    "environment"
            },

            config,

            onScanSuccess,

            onScanError

        );


        isScannerRunning = true;


        console.log(
            "Scanner berhasil dimulai."
        );


    } catch (error) {

        console.error(
            "Gagal memulai scanner:",
            error
        );


        reader.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
            ">

                <p>
                    Kamera tidak dapat digunakan.
                </p>

                <p style="
                    font-size:14px;
                    color:#666;
                ">

                    Pastikan browser memiliki
                    izin menggunakan kamera.

                </p>

            </div>

        `;


        alert(
            "Kamera tidak dapat digunakan.\n\n" +
            "Pastikan izin kamera sudah diberikan kepada browser."
        );

    }

}


// ======================================================
// SCAN BERHASIL
// ======================================================

function onScanSuccess(
    decodedText,
    decodedResult
) {

    console.log(
        "QR berhasil dibaca:",
        decodedText
    );


    stopScanner();


    processQRCode(
        decodedText
    );

}


// ======================================================
// SCAN ERROR
// ======================================================

function onScanError(
    errorMessage
) {

    // Tidak perlu menampilkan error
    // karena callback ini terus berjalan
    // selama kamera mencari QR.

}


// ======================================================
// STOP SCANNER
// ======================================================

async function stopScanner() {

    if (
        !html5QrCode ||
        !isScannerRunning
    ) {

        return;

    }


    try {

        await html5QrCode.stop();


        isScannerRunning = false;


        console.log(
            "Scanner dihentikan."
        );


    } catch (error) {

        console.warn(
            "Gagal menghentikan scanner:",
            error
        );


        isScannerRunning = false;

    }

}


// ======================================================
// MEMPROSES QR CODE
// ======================================================

function processQRCode(
    decodedText
) {

    let qrData;


    // --------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------

    try {

        qrData =
            JSON.parse(
                decodedText
            );

    } catch (error) {

        console.error(
            "QR bukan JSON:",
            error
        );


        alert(
            "QR Code tidak valid.\n\n" +
            "Silakan scan QR sesi yang dibuat oleh admin."
        );


        restartScanner();


        return;

    }


    console.log(
        "Data QR:",
        qrData
    );


    // --------------------------------------------------
    // VALIDASI TYPE
    // --------------------------------------------------

    if (
        !qrData ||
        qrData.type !==
        "SMART_ATTENDANCE"
    ) {

        alert(
            "QR Code bukan QR Smart Attendance."
        );


        restartScanner();


        return;

    }


    // --------------------------------------------------
    // VALIDASI MATA KULIAH
    // --------------------------------------------------

    if (!qrData.course) {

        alert(
            "Data mata kuliah pada QR tidak ditemukan."
        );


        restartScanner();


        return;

    }


    // --------------------------------------------------
    // VALIDASI PERTEMUAN
    // --------------------------------------------------

    if (!qrData.meeting) {

        alert(
            "Data pertemuan pada QR tidak ditemukan."
        );


        restartScanner();


        return;

    }


    // --------------------------------------------------
    // VALIDASI SESSION
    // --------------------------------------------------

    if (!qrData.session) {

        alert(
            "Kode sesi pada QR tidak ditemukan."
        );


        restartScanner();


        return;

    }


    // --------------------------------------------------
    // SIMPAN SESI
    // --------------------------------------------------

    currentSession = {

        type:
            qrData.type,

        course:
            qrData.course,

        meeting:
            qrData.meeting,

        session:
            qrData.session

    };


    console.log(
        "Sesi berhasil ditemukan:",
        currentSession
    );


    // Tampilkan konfirmasi
    showConfirmation();

}


// ======================================================
// RESTART SCANNER
// ======================================================

async function restartScanner() {

    const reader =
        getElement("reader");


    if (reader) {

        reader.innerHTML = "";

    }


    await startScanner();

}


// ======================================================
// STEP 3
// KONFIRMASI PRESENSI
// ======================================================

function showConfirmation() {

    if (!currentStudent) {

        alert(
            "Data mahasiswa tidak ditemukan."
        );

        return;

    }


    if (!currentSession) {

        alert(
            "Data sesi tidak ditemukan."
        );

        return;

    }


    // --------------------------------------------------
    // NAMA
    // --------------------------------------------------

    const confirmName =
        getElement("confirmName");


    if (confirmName) {

        confirmName.innerText =
            currentStudent.name;

    }


    // --------------------------------------------------
    // NIM
    // --------------------------------------------------

    const confirmNim =
        getElement("confirmNim");


    if (confirmNim) {

        confirmNim.innerText =
            currentStudent.nim;

    }


    // --------------------------------------------------
    // MATA KULIAH
    // --------------------------------------------------

    const confirmCourse =
        getElement("confirmCourse");


    if (confirmCourse) {

        confirmCourse.innerText =
            currentSession.course;

    }


    // --------------------------------------------------
    // PERTEMUAN
    // --------------------------------------------------

    const confirmMeeting =
        getElement("confirmMeeting");


    if (confirmMeeting) {

        confirmMeeting.innerText =
            "Pertemuan " +
            currentSession.meeting;

    }


    showSection(
        "confirmationSection"
    );

}


// ======================================================
// STEP 4
// SIMPAN PRESENSI
// ======================================================

async function submitAttendance() {

    // --------------------------------------------------
    // VALIDASI
    // --------------------------------------------------

    if (!currentStudent) {

        alert(
            "Data mahasiswa belum tersedia."
        );

        return;

    }


    if (!currentSession) {

        alert(
            "Data sesi belum tersedia."
        );

        return;

    }


    const submitBtn =
        getElement("submitBtn");


    if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            "Menyimpan...";

    }


    // --------------------------------------------------
    // MODE DEMO
    // --------------------------------------------------

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE === true
    ) {

        saveDemoAttendance();

        return;

    }


    // --------------------------------------------------
    // MODE ONLINE
    // --------------------------------------------------

    try {

        const attendance = {

            nim:
                currentStudent.nim,

            name:
                currentStudent.name,

            course:
                currentSession.course,

            meeting:
                currentSession.meeting,

            session:
                currentSession.session,

            status:
                "Hadir"

        };


        console.log(
            "Data presensi:",
            attendance
        );


        /*
         * POST menggunakan no-cors.
         *
         * Google Apps Script akan menerima
         * data JSON dari website.
         *
         * Karena no-cors menghasilkan response
         * opaque, response dari Apps Script
         * tidak dapat dibaca oleh browser.
         */

        await fetch(
            API_URL,
            {

                method: "POST",

                mode: "no-cors",

                body:
                    JSON.stringify(
                        attendance
                    )

            }
        );


        console.log(
            "Request presensi berhasil dikirim."
        );


        showSuccess();


    } catch (error) {

        console.error(
            "Gagal menyimpan presensi:",
            error
        );


        alert(
            "Presensi gagal dikirim.\n\n" +
            "Periksa koneksi internet dan coba lagi.\n\n" +
            "Detail: " +
            error.message
        );


        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerText =
                "Presensi Sekarang";

        }

    }

}


// ======================================================
// DEMO - SIMPAN PRESENSI
// ======================================================

function saveDemoAttendance() {

    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "id-ID"
        );


    const time =
        now.toLocaleTimeString(
            "id-ID",
            {

                hour: "2-digit",
                minute: "2-digit"

            }
        );


    const attendance = {

        id:
            "DEMO-" +
            Date.now(),

        nim:
            currentStudent.nim,

        name:
            currentStudent.name,

        course:
            currentSession.course,

        meeting:
            currentSession.meeting,

        session:
            currentSession.session,

        date:
            date,

        time:
            time,

        status:
            "Hadir"

    };


    let history =
        JSON.parse(
            localStorage.getItem(
                "attendanceHistory"
            ) || "[]"
        );


    // --------------------------------------------------
    // CEK DUPLIKAT
    // --------------------------------------------------

    const duplicate =
        history.some(
            item =>
                item.nim ===
                    attendance.nim &&
                item.session ===
                    attendance.session
        );


    if (duplicate) {

        alert(
            "Anda sudah melakukan presensi pada sesi ini."
        );


        const submitBtn =
            getElement("submitBtn");


        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerText =
                "Presensi Sekarang";

        }


        return;

    }


    history.push(
        attendance
    );


    localStorage.setItem(
        "attendanceHistory",
        JSON.stringify(history)
    );


    showSuccess();

}


// ======================================================
// STEP 5
// HALAMAN BERHASIL
// ======================================================

function showSuccess() {

    if (
        !currentStudent ||
        !currentSession
    ) {

        return;

    }


    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "id-ID",
            {

                day: "2-digit",
                month: "2-digit",
                year: "numeric"

            }
        );


    const time =
        now.toLocaleTimeString(
            "id-ID",
            {

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"

            }
        );


    // --------------------------------------------------
    // NIM
    // --------------------------------------------------

    const successNim =
        getElement("successNim");


    if (successNim) {

        successNim.innerText =
            currentStudent.nim;

    }


    // --------------------------------------------------
    // NAMA
    // --------------------------------------------------

    const successName =
        getElement("successName");


    if (successName) {

        successName.innerText =
            currentStudent.name;

    }


    // --------------------------------------------------
    // MATA KULIAH
    // --------------------------------------------------

    const successCourse =
        getElement("successCourse");


    if (successCourse) {

        successCourse.innerText =
            currentSession.course;

    }


    // --------------------------------------------------
    // PERTEMUAN
    // --------------------------------------------------

    const successMeeting =
        getElement("successMeeting");


    if (successMeeting) {

        successMeeting.innerText =
            "Pertemuan " +
            currentSession.meeting;

    }


    // --------------------------------------------------
    // TANGGAL
    // --------------------------------------------------

    const successDate =
        getElement("successDate");


    if (successDate) {

        successDate.innerText =
            date;

    }


    // --------------------------------------------------
    // WAKTU
    // --------------------------------------------------

    const successTime =
        getElement("successTime");


    if (successTime) {

        successTime.innerText =
            time;

    }


    // --------------------------------------------------
    // SESSION
    // --------------------------------------------------

    const successSession =
        getElement("successSession");


    if (successSession) {

        successSession.innerText =
            currentSession.session;

    }


    // --------------------------------------------------
    // TAMPILKAN SUCCESS
    // --------------------------------------------------

    showSection(
        "successSection"
    );

}


// ======================================================
// RESET
// ======================================================

async function resetAttendance() {

    await stopScanner();


    currentStudent = null;

    currentSession = null;


    const nimInput =
        getElement("nimInput");


    if (nimInput) {

        nimInput.value = "";

    }


    const submitBtn =
        getElement("submitBtn");


    if (submitBtn) {

        submitBtn.disabled = false;

        submitBtn.innerText =
            "Presensi Sekarang";

    }


    showSection(
        "nimSection"
    );


    if (nimInput) {

        nimInput.focus();

    }

}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.startAttendance =
    startAttendance;


window.submitAttendance =
    submitAttendance;


window.resetAttendance =
    resetAttendance;


window.showConfirmation =
    showConfirmation;


window.processQRCode =
    processQRCode;