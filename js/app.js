// ======================================================
// SMART ATTENDANCE - APP.JS
// ======================================================


// ======================================================
// VARIABEL GLOBAL
// ======================================================

let scanner = null;

let currentStudent = null;

let currentSession = null;

let isScanning = false;


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
// EVENT BUTTON
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
// MULAI PRESENSI
// ======================================================

async function startAttendance() {

    const nim =
        nimInput
            ? nimInput.value.trim()
            : "";


    // ==================================================
    // CEK NIM
    // ==================================================

    if (!nim) {

        alert(
            "Silakan masukkan NIM terlebih dahulu."
        );

        if (nimInput) {
            nimInput.focus();
        }

        return;
    }


    // ==================================================
    // CEK API
    // ==================================================

    if (
        typeof API_URL === "undefined" ||
        !API_URL ||
        API_URL.includes(
            "MASUKKAN_URL"
        )
    ) {

        alert(
            "API Google Apps Script belum dikonfigurasi."
        );

        return;
    }


    // ==================================================
    // NONAKTIFKAN TOMBOL
    // ==================================================

    if (continueBtn) {

        continueBtn.disabled = true;

        continueBtn.textContent =
            "Memeriksa NIM...";
    }


    try {

        // ==================================================
        // CARI MAHASISWA DI GOOGLE SHEETS
        // ==================================================

        const result =
            await getStudentFromGoogleSheets(
                nim
            );


        console.log(
            "Hasil pencarian mahasiswa:",
            result
        );


        // ==================================================
        // JIKA GAGAL
        // ==================================================

        if (
            !result ||
            result.success !== true ||
            !result.student
        ) {

            alert(
                result &&
                result.message
                    ? result.message
                    : "NIM tidak ditemukan."
            );

            enableContinueButton();

            return;
        }


        // ==================================================
        // SIMPAN DATA MAHASISWA
        // ==================================================

        currentStudent = {

            nim:
                String(
                    result.student.nim
                ),

            name:
                result.student.name ||
                "Mahasiswa",

            class:
                result.student.class ||
                ""
        };


        console.log(
            "Mahasiswa ditemukan:",
            currentStudent
        );


        // ==================================================
        // PINDAH KE SCANNER
        // ==================================================

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


        // Beri waktu agar scanner tampil
        setTimeout(
            function () {

                startScanner();

            },
            300
        );


    } catch (error) {

        console.error(
            "ERROR MENCARI MAHASISWA:",
            error
        );


        alert(
            "Gagal mengambil data mahasiswa dari Google Sheets.\n\n" +
            "Periksa koneksi internet dan konfigurasi Google Apps Script."
        );


        enableContinueButton();
    }
}


// ======================================================
// AMBIL DATA MAHASISWA GOOGLE SHEETS
// ======================================================
//
// Menggunakan JSONP supaya tidak terkena masalah CORS.
//

function getStudentFromGoogleSheets(
    nim
) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const callbackName =
                "smartAttendanceStudent_" +
                Date.now() +
                "_" +
                Math.floor(
                    Math.random() * 10000
                );


            const script =
                document.createElement(
                    "script"
                );


            const timeout =
                setTimeout(
                    function () {

                        cleanup();

                        reject(
                            new Error(
                                "Timeout mengambil data mahasiswa."
                            )
                        );

                    },
                    15000
                );


            function cleanup() {

                clearTimeout(
                    timeout
                );


                if (
                    script.parentNode
                ) {

                    script.parentNode.removeChild(
                        script
                    );
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


            window[
                callbackName
            ] = function (
                result
            ) {

                cleanup();

                resolve(
                    result
                );
            };


            script.onerror =
                function () {

                    cleanup();

                    reject(
                        new Error(
                            "Gagal menghubungi Google Apps Script."
                        )
                    );
                };


            const url =
                API_URL +
                "?action=student" +
                "&nim=" +
                encodeURIComponent(
                    nim
                ) +
                "&callback=" +
                encodeURIComponent(
                    callbackName
                );


            script.src = url;


            document.body.appendChild(
                script
            );
        }
    );
}


// ======================================================
// AKTIFKAN TOMBOL LANJUTKAN
// ======================================================

function enableContinueButton() {

    if (continueBtn) {

        continueBtn.disabled =
            false;

        continueBtn.textContent =
            "Lanjutkan →";
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


        // ==================================================
        // CEK LIBRARY
        // ==================================================

        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            alert(
                "QR Scanner gagal dimuat.\n\n" +
                "Pastikan koneksi internet aktif."
            );

            return;
        }


        // ==================================================
        // CEK READER
        // ==================================================

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


        // ==================================================
        // BERSIHKAN SCANNER LAMA
        // ==================================================

        if (scanner) {

            try {

                await scanner.stop();

            } catch (error) {

                console.log(
                    "Scanner lama sudah berhenti."
                );
            }


            try {

                scanner.clear();

            } catch (error) {

                console.log(
                    "Scanner lama sudah dibersihkan."
                );
            }


            scanner = null;
        }


        reader.innerHTML = "";


        // ==================================================
        // BUAT SCANNER
        // ==================================================

        scanner =
            new Html5Qrcode(
                "reader"
            );


        // ==================================================
        // CARI KAMERA
        // ==================================================

        const cameras =
            await Html5Qrcode.getCameras();


        if (
            !cameras ||
            cameras.length === 0
        ) {

            alert(
                "Kamera tidak ditemukan.\n\n" +
                "Pastikan browser memiliki izin kamera."
            );

            return;
        }


        // ==================================================
        // PILIH KAMERA BELAKANG
        // ==================================================

        let selectedCamera =
            cameras[0];


        for (
            const camera
            of cameras
        ) {

            const label =
                (
                    camera.label ||
                    ""
                ).toLowerCase();


            if (

                label.includes(
                    "back"
                ) ||

                label.includes(
                    "rear"
                ) ||

                label.includes(
                    "environment"
                ) ||

                label.includes(
                    "belakang"
                )

            ) {

                selectedCamera =
                    camera;

                break;
            }
        }


        // ==================================================
        // KONFIGURASI
        // ==================================================

        const scannerConfig = {

            fps: 10,

            qrbox:
                function (
                    viewfinderWidth,
                    viewfinderHeight
                ) {

                    const minEdge =
                        Math.min(
                            viewfinderWidth,
                            viewfinderHeight
                        );


                    const size =
                        Math.floor(
                            minEdge * 0.75
                        );


                    return {

                        width:
                            size,

                        height:
                            size
                    };
                },

            aspectRatio: 1.0,

            formatsToSupport: [

                Html5QrcodeSupportedFormats
                    .QR_CODE

            ]
        };


        // ==================================================
        // MULAI SCANNER
        // ==================================================

        await scanner.start(

            selectedCamera.id,

            scannerConfig,

            function (
                decodedText,
                decodedResult
            ) {

                onScanSuccess(
                    decodedText,
                    decodedResult
                );
            },

            function () {

                // QR belum ditemukan.
                // Tidak perlu menampilkan pesan.

            }
        );


        isScanning =
            true;


        console.log(
            "Scanner berhasil dimulai."
        );


    } catch (error) {

        isScanning =
            false;


        console.error(
            "ERROR KAMERA:",
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


    isScanning =
        false;


    console.log(
        "QR CODE BERHASIL DIBACA!"
    );


    console.log(
        "Isi QR:",
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


        // ==================================================
        // CEK TYPE
        // ==================================================

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


        // ==================================================
        // CEK DATA
        // ==================================================

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


        // ==================================================
        // SIMPAN SESSION
        // ==================================================

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
            "Session:",
            currentSession
        );


        // ==================================================
        // TAMPILKAN KONFIRMASI
        // ==================================================

        showConfirmation();


    } catch (error) {

        console.error(
            "QR bukan JSON:",
            error
        );


        alert(
            "QR berhasil terbaca, tetapi format QR tidak sesuai."
        );


        restartScanner();
    }
}


// ======================================================
// TAMPILKAN KONFIRMASI
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


    // ==================================================
    // DATA MAHASISWA
    // ==================================================

    if (confirmName) {

        confirmName.textContent =
            currentStudent.name;
    }


    if (confirmNim) {

        confirmNim.textContent =
            currentStudent.nim;
    }


    // ==================================================
    // DATA SESSION
    // ==================================================

    if (confirmCourse) {

        confirmCourse.textContent =
            currentSession.course;
    }


    if (confirmMeeting) {

        confirmMeeting.textContent =
            "Pertemuan " +
            currentSession.meeting;
    }


    // ==================================================
    // TAMPILKAN
    // ==================================================

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
// SIMPAN PRESENSI
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


    // ==================================================
    // CEGAH DOUBLE CLICK
    // ==================================================

    if (submitBtn) {

        submitBtn.disabled =
            true;

        submitBtn.textContent =
            "Mengirim...";
    }


    // ==================================================
    // WAKTU
    // ==================================================

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


    // ==================================================
    // DATA PRESENSI
    // ==================================================

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
        "Data presensi:",
        attendance
    );


    // ==================================================
    // MODE ONLINE
    // ==================================================

    try {

        if (
            typeof API_URL ===
                "undefined" ||

            !API_URL ||

            API_URL.includes(
                "MASUKKAN_URL"
            )
        ) {

            throw new Error(
                "API URL belum diatur."
            );
        }


        console.log(
            "Mengirim presensi ke Google Sheets..."
        );


        // ==================================================
        // POST
        // ==================================================
        //
        // no-cors digunakan untuk menghindari
        // masalah CORS pada Google Apps Script.
        //
        // Jangan tambahkan Content-Type.
        //

        await fetch(

            API_URL,

            {

                method:
                    "POST",

                mode:
                    "no-cors",

                body:
                    JSON.stringify(
                        attendance
                    )
            }
        );


        console.log(
            "Request presensi berhasil dikirim."
        );


        // ==================================================
        // TAMPILKAN BERHASIL
        // ==================================================

        showSuccess(
            attendance
        );


    } catch (error) {

        console.error(
            "ERROR GOOGLE SHEETS:",
            error
        );


        alert(
            "Gagal mengirim data presensi.\n\n" +
            "Periksa koneksi internet dan konfigurasi Google Apps Script."
        );


        enableSubmitButton();
    }
}


// ======================================================
// AKTIFKAN TOMBOL SUBMIT
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
// TAMPILKAN PRESENSI BERHASIL
// ======================================================

function showSuccess(
    attendance
) {

    // ==================================================
    // DATA
    // ==================================================

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


    // ==================================================
    // TAMPILKAN SUCCESS
    // ==================================================

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
}


// ======================================================
// STOP SCANNER
// ======================================================

async function stopScanner() {

    if (!scanner) {

        isScanning =
            false;

        return;
    }


    try {

        await scanner.stop();

    } catch (error) {

        console.log(
            "Scanner sudah berhenti."
        );
    }


    try {

        scanner.clear();

    } catch (error) {

        console.log(
            "Scanner sudah dibersihkan."
        );
    }


    scanner =
        null;


    isScanning =
        false;
}


// ======================================================
// RESTART SCANNER
// ======================================================

async function restartScanner() {

    await stopScanner();


    setTimeout(

        function () {

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


    currentStudent =
        null;


    currentSession =
        null;


    if (nimInput) {

        nimInput.value =
            "";
    }


    enableContinueButton();


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

        function (
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
// ENTER PADA NIM
// ======================================================

if (nimInput) {

    nimInput.addEventListener(

        "keydown",

        function (
            event
        ) {

            if (
                event.key ===
                "Enter"
            ) {

                startAttendance();
            }
        }
    );
}


// ======================================================
// CEK APLIKASI
// ======================================================

console.log(
    "Smart Attendance siap digunakan."
);