// ======================================================
// SMART ATTENDANCE - APP.JS
// FINAL VERSION
// ======================================================


// ======================================================
// GOOGLE APPS SCRIPT URL
// ======================================================

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzWWNjij2MPfayamk2oGLChNtOyOSCk3BtTHyUqq9K0bWlNpoKSnaAfgJQXcMlnPnsu/exec";


// ======================================================
// VARIABEL GLOBAL
// ======================================================

let scanner = null;

let currentStudent = null;

let currentSession = null;

let isScanning = false;

let jsonpCounter = 0;


// ======================================================
// ELEMENT HTML
// ======================================================

const nimSection =
    document.getElementById(
        "nimSection"
    );

const scannerSection =
    document.getElementById(
        "scannerSection"
    );

const confirmationSection =
    document.getElementById(
        "confirmationSection"
    );

const successSection =
    document.getElementById(
        "successSection"
    );


const nimInput =
    document.getElementById(
        "nimInput"
    );

const continueBtn =
    document.getElementById(
        "continueBtn"
    );


const confirmNim =
    document.getElementById(
        "confirmNim"
    );

const confirmName =
    document.getElementById(
        "confirmName"
    );

const confirmCourse =
    document.getElementById(
        "confirmCourse"
    );

const confirmMeeting =
    document.getElementById(
        "confirmMeeting"
    );


const submitBtn =
    document.getElementById(
        "submitBtn"
    );

const resetBtn =
    document.getElementById(
        "resetBtn"
    );


const successNim =
    document.getElementById(
        "successNim"
    );

const successName =
    document.getElementById(
        "successName"
    );

const successCourse =
    document.getElementById(
        "successCourse"
    );

const successMeeting =
    document.getElementById(
        "successMeeting"
    );

const successDate =
    document.getElementById(
        "successDate"
    );

const successTime =
    document.getElementById(
        "successTime"
    );

const successSession =
    document.getElementById(
        "successSession"
    );


// ======================================================
// EVENT
// ======================================================

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        startAttendance
    );
}


if (submitBtn) {

    submitBtn.addEventListener(
        "click",
        submitAttendance
    );
}


if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        resetAttendance
    );
}


// ======================================================
// JSONP REQUEST
// Digunakan agar GitHub Pages dapat membaca
// data dari Google Apps Script.
// ======================================================

function jsonpRequest(
    params
) {

    return new Promise(
        function(resolve, reject) {

            const callbackName =
                "__smartAttendanceCallback_" +
                Date.now() +
                "_" +
                (++jsonpCounter);


            const script =
                document.createElement(
                    "script"
                );


            let finished = false;


            const timeout =
                setTimeout(
                    function() {

                        if (finished) {
                            return;
                        }


                        finished = true;


                        cleanup();


                        reject(
                            new Error(
                                "Google Apps Script tidak memberikan respons."
                            )
                        );

                    },
                    15000
                );


            window[callbackName] =
                function(data) {

                    if (finished) {
                        return;
                    }


                    finished = true;


                    clearTimeout(
                        timeout
                    );


                    cleanup();


                    resolve(
                        data
                    );
                };


            function cleanup() {

                try {

                    script.remove();

                } catch (error) {
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


            const query =
                new URLSearchParams();


            Object.keys(params)
                .forEach(
                    function(key) {

                        query.append(
                            key,
                            params[key]
                        );
                    }
                );


            query.append(
                "callback",
                callbackName
            );


            query.append(
                "_",
                Date.now()
            );


            script.src =
                GOOGLE_SCRIPT_URL +
                "?" +
                query.toString();


            script.async = true;


            script.onerror =
                function() {

                    if (finished) {
                        return;
                    }


                    finished = true;


                    clearTimeout(
                        timeout
                    );


                    cleanup();


                    reject(
                        new Error(
                            "Tidak dapat terhubung ke Google Apps Script."
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


// ======================================================
// AMBIL DATA MAHASISWA
// ======================================================

async function getStudentByNim(
    nim
) {

    const result =
        await jsonpRequest({

            action: "student",

            nim: nim
        });


    return result;
}


// ======================================================
// MULAI PRESENSI
// ======================================================

async function startAttendance() {

    const nim =
        nimInput
            ? nimInput.value.trim()
            : "";


    // ================================================
    // CEK NIM
    // ================================================

    if (!nim) {

        alert(
            "Silakan masukkan NIM terlebih dahulu."
        );

        if (nimInput) {
            nimInput.focus();
        }

        return;
    }


    // ================================================
    // CEGAH KLIK BERULANG
    // ================================================

    if (continueBtn) {

        continueBtn.disabled = true;

        continueBtn.textContent =
            "Memeriksa NIM...";
    }


    try {

        console.log(
            "Mencari mahasiswa:",
            nim
        );


        // ============================================
        // AMBIL DATA DARI GOOGLE SHEETS
        // ============================================

        const result =
            await getStudentByNim(
                nim
            );


        console.log(
            "Response mahasiswa:",
            result
        );


        // ============================================
        // NIM TIDAK DITEMUKAN
        // ============================================

        if (
            !result ||
            result.success !== true ||
            !result.data
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "NIM tidak ditemukan."
            );
        }


        // ============================================
        // SIMPAN MAHASISWA
        // ============================================

        currentStudent = {

            nim:
                String(
                    result.data.nim
                ).trim(),

            name:
                String(
                    result.data.name ||
                    "Mahasiswa"
                ).trim()
        };


        console.log(
            "Mahasiswa ditemukan:",
            currentStudent
        );


        // ============================================
        // PINDAH KE SCANNER
        // ============================================

        hideSection(
            nimSection
        );

        hideSection(
            confirmationSection
        );

        hideSection(
            successSection
        );

        showSection(
            scannerSection
        );


        updateSteps(2);


        // ============================================
        // MULAI SCANNER
        // ============================================

        setTimeout(
            function() {

                startScanner();

            },
            300
        );


    } catch (error) {

        console.error(
            "ERROR MENGAMBIL DATA MAHASISWA:",
            error
        );


        alert(
            "Gagal mengambil data mahasiswa dari Google Sheets.\n\n" +
            error.message +
            "\n\n" +
            "Pastikan NIM ada di Sheet Mahasiswa."
        );


        currentStudent = null;


    } finally {

        if (continueBtn) {

            continueBtn.disabled =
                false;

            continueBtn.textContent =
                "Lanjutkan →";
        }
    }
}


// ======================================================
// START QR SCANNER
// ======================================================

async function startScanner() {

    try {

        if (isScanning) {
            return;
        }


        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            alert(
                "QR Scanner gagal dimuat. Pastikan library Html5Qrcode tersedia."
            );

            return;
        }


        const reader =
            document.getElementById(
                "reader"
            );


        if (!reader) {

            alert(
                "Area scanner tidak ditemukan."
            );

            return;
        }


        // ============================================
        // BERSIHKAN SCANNER LAMA
        // ============================================

        if (scanner) {

            try {

                await scanner.stop();

            } catch (error) {
            }


            try {

                scanner.clear();

            } catch (error) {
            }


            scanner = null;
        }


        reader.innerHTML = "";


        // ============================================
        // BUAT SCANNER
        // ============================================

        scanner =
            new Html5Qrcode(
                "reader"
            );


        // ============================================
        // CARI KAMERA
        // ============================================

        const cameras =
            await Html5Qrcode.getCameras();


        if (
            !cameras ||
            cameras.length === 0
        ) {

            alert(
                "Kamera tidak ditemukan. Izinkan browser menggunakan kamera."
            );

            return;
        }


        let selectedCamera =
            cameras[0];


        for (
            const camera of cameras
        ) {

            const label =
                (
                    camera.label ||
                    ""
                ).toLowerCase();


            if (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment") ||
                label.includes("belakang")
            ) {

                selectedCamera =
                    camera;

                break;
            }
        }


        // ============================================
        // CONFIG
        // ============================================

        const scannerConfig = {

            fps: 10,

            qrbox:
                function(
                    width,
                    height
                ) {

                    const minEdge =
                        Math.min(
                            width,
                            height
                        );


                    const size =
                        Math.floor(
                            minEdge * 0.75
                        );


                    return {

                        width: size,

                        height: size
                    };
                },

            aspectRatio: 1.0,

            formatsToSupport: [

                Html5QrcodeSupportedFormats
                    .QR_CODE
            ]
        };


        // ============================================
        // START CAMERA
        // ============================================

        await scanner.start(

            selectedCamera.id,

            scannerConfig,

            function(
                decodedText,
                decodedResult
            ) {

                onScanSuccess(
                    decodedText,
                    decodedResult
                );
            },

            function() {
                // QR belum ditemukan
            }
        );


        isScanning = true;


        console.log(
            "Scanner berhasil dimulai."
        );


    } catch (error) {

        isScanning = false;


        console.error(
            "ERROR SCANNER:",
            error
        );


        alert(
            "Kamera tidak dapat digunakan.\n\n" +
            "Pastikan izin kamera sudah diberikan."
        );
    }
}


// ======================================================
// QR BERHASIL DIBACA
// ======================================================

async function onScanSuccess(
    decodedText,
    decodedResult
) {

    if (!isScanning) {
        return;
    }


    isScanning = false;


    console.log(
        "QR berhasil dibaca:",
        decodedText
    );


    await stopScanner();


    handleQRCode(
        decodedText
    );
}


// ======================================================
// PROSES QR
// ======================================================

function handleQRCode(
    decodedText
) {

    try {

        const qrData =
            JSON.parse(
                decodedText
            );


        console.log(
            "Data QR:",
            qrData
        );


        // ============================================
        // CEK TYPE
        // ============================================

        if (
            qrData.type !==
            "SMART_ATTENDANCE"
        ) {

            alert(
                "QR Code ini bukan QR Smart Attendance."
            );

            restartScanner();

            return;
        }


        // ============================================
        // CEK DATA
        // ============================================

        if (
            !qrData.course ||
            !qrData.meeting ||
            !qrData.session
        ) {

            alert(
                "Data QR tidak lengkap."
            );

            restartScanner();

            return;
        }


        // ============================================
        // SIMPAN SESSION
        // ============================================

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


        // ============================================
        // TAMPILKAN KONFIRMASI
        // ============================================

        showConfirmation();


    } catch (error) {

        console.error(
            error
        );


        alert(
            "QR berhasil dibaca, tetapi format QR tidak sesuai."
        );


        restartScanner();
    }
}


// ======================================================
// KONFIRMASI
// ======================================================

function showConfirmation() {

    if (
        !currentStudent ||
        !currentSession
    ) {

        alert(
            "Data mahasiswa atau sesi tidak ditemukan."
        );

        return;
    }


    // ============================================
    // NAMA
    // ============================================

    if (confirmName) {

        confirmName.textContent =
            currentStudent.name;
    }


    // ============================================
    // NIM
    // ============================================

    if (confirmNim) {

        confirmNim.textContent =
            currentStudent.nim;
    }


    // ============================================
    // MATA KULIAH
    // ============================================

    if (confirmCourse) {

        confirmCourse.textContent =
            currentSession.course;
    }


    // ============================================
    // PERTEMUAN
    // ============================================

    if (confirmMeeting) {

        confirmMeeting.textContent =
            "Pertemuan " +
            currentSession.meeting;
    }


    hideSection(
        nimSection
    );

    hideSection(
        scannerSection
    );

    hideSection(
        successSection
    );


    showSection(
        confirmationSection
    );


    updateSteps(3);
}


// ======================================================
// SUBMIT PRESENSI
// ======================================================

async function submitAttendance() {

    if (
        !currentStudent ||
        !currentSession
    ) {

        alert(
            "Data presensi tidak lengkap."
        );

        return;
    }


    if (submitBtn) {

        submitBtn.disabled =
            true;

        submitBtn.textContent =
            "Menyimpan...";
    }


    // ============================================
    // DATA WAKTU
    // ============================================

    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "id-ID"
        );


    const time =
        now.toLocaleTimeString(
            "id-ID"
        );


    // ============================================
    // DATA PRESENSI
    // ============================================

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

        date:
            date,

        time:
            time,

        status:
            "Hadir"
    };


    console.log(
        "Mengirim presensi:",
        attendance
    );


    try {

        // ============================================
        // KIRIM KE GOOGLE APPS SCRIPT
        // ============================================

        await fetch(

            GOOGLE_SCRIPT_URL,

            {

                method: "POST",

                mode: "no-cors",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(
                        attendance
                    )
            }
        );


        console.log(
            "Request presensi dikirim."
        );


        // ============================================
        // TAMPILKAN SUKSES
        // ============================================

        showSuccess(
            attendance
        );


    } catch (error) {

        console.error(
            "ERROR SIMPAN:",
            error
        );


        alert(
            "Gagal menyimpan presensi.\n\n" +
            error.message
        );


        enableSubmitButton();
    }
}


// ======================================================
// TAMPILKAN SUKSES
// ======================================================

function showSuccess(
    attendance
) {

    if (successNim) {

        successNim.textContent =
            attendance.nim;
    }


    if (successName) {

        successName.textContent =
            attendance.name;
    }


    if (successCourse) {

        successCourse.textContent =
            attendance.course;
    }


    if (successMeeting) {

        successMeeting.textContent =
            "Pertemuan " +
            attendance.meeting;
    }


    if (successDate) {

        successDate.textContent =
            attendance.date;
    }


    if (successTime) {

        successTime.textContent =
            attendance.time;
    }


    if (successSession) {

        successSession.textContent =
            attendance.session;
    }


    hideSection(
        nimSection
    );

    hideSection(
        scannerSection
    );

    hideSection(
        confirmationSection
    );


    showSection(
        successSection
    );


    updateSteps(4);


    enableSubmitButton();
}


// ======================================================
// STOP SCANNER
// ======================================================

async function stopScanner() {

    if (!scanner) {

        isScanning = false;

        return;
    }


    try {

        await scanner.stop();

    } catch (error) {
    }


    try {

        scanner.clear();

    } catch (error) {
    }


    scanner = null;

    isScanning = false;
}


// ======================================================
// RESTART SCANNER
// ======================================================

async function restartScanner() {

    await stopScanner();


    setTimeout(
        function() {

            startScanner();

        },
        500
    );
}


// ======================================================
// RESET
// ======================================================

async function resetAttendance() {

    await stopScanner();


    currentStudent = null;

    currentSession = null;


    if (nimInput) {

        nimInput.value = "";
    }


    enableSubmitButton();


    hideSection(
        scannerSection
    );

    hideSection(
        confirmationSection
    );

    hideSection(
        successSection
    );


    showSection(
        nimSection
    );


    updateSteps(1);
}


// ======================================================
// ENABLE SUBMIT
// ======================================================

function enableSubmitButton() {

    if (submitBtn) {

        submitBtn.disabled =
            false;

        submitBtn.textContent =
            "Presensi Sekarang ✓";
    }
}


// ======================================================
// SHOW SECTION
// ======================================================

function showSection(
    section
) {

    if (section) {

        section.classList.remove(
            "hidden"
        );
    }
}


// ======================================================
// HIDE SECTION
// ======================================================

function hideSection(
    section
) {

    if (section) {

        section.classList.add(
            "hidden"
        );
    }
}


// ======================================================
// UPDATE STEP
// ======================================================

function updateSteps(
    step
) {

    const steps =
        document.querySelectorAll(
            ".step"
        );


    steps.forEach(
        function(
            item,
            index
        ) {

            if (
                index < step
            ) {

                item.classList.add(
                    "active"
                );

            } else {

                item.classList.remove(
                    "active"
                );
            }
        }
    );
}


// ======================================================
// ENTER PADA INPUT NIM
// ======================================================

if (nimInput) {

    nimInput.addEventListener(

        "keydown",

        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                startAttendance();
            }
        }
    );
}


// ======================================================
// CEK APLIKASI
// ======================================================

console.log(
    "Smart Attendance FINAL APP.JS aktif."
);

console.log(
    "Google Apps Script:",
    GOOGLE_SCRIPT_URL
);