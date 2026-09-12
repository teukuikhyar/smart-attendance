// ==========================================
// SMART ATTENDANCE - APP.JS
// ==========================================

// ===============================
// DATA MAHASISWA DEMO
// ===============================

const students = {
    "230101001": "Teuku Ikhyar",
    "230101002": "Muhammad Rizki",
    "230101003": "Siti Aisyah",
    "230101004": "Fajar Maulana"
};


// ===============================
// VARIABEL
// ===============================

let scanner = null;
let currentStudent = null;
let currentSession = null;
let isScanning = false;


// ===============================
// ELEMENT HTML
// ===============================

const nimSection = document.getElementById("nimSection");
const scannerSection = document.getElementById("scannerSection");
const confirmationSection = document.getElementById("confirmationSection");
const successSection = document.getElementById("successSection");

const nimInput = document.getElementById("nimInput");
const continueBtn = document.getElementById("continueBtn");

const confirmNim = document.getElementById("confirmNim");
const confirmName = document.getElementById("confirmName");
const confirmCourse = document.getElementById("confirmCourse");
const confirmMeeting = document.getElementById("confirmMeeting");

const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");

const successNim = document.getElementById("successNim");
const successName = document.getElementById("successName");
const successCourse = document.getElementById("successCourse");
const successMeeting = document.getElementById("successMeeting");
const successDate = document.getElementById("successDate");
const successTime = document.getElementById("successTime");
const successSession = document.getElementById("successSession");


// ===============================
// TOMBOL LANJUTKAN
// ===============================

if (continueBtn) {
    continueBtn.addEventListener("click", startAttendance);
}


// ===============================
// TOMBOL PRESENSI
// ===============================

if (submitBtn) {
    submitBtn.addEventListener("click", submitAttendance);
}


// ===============================
// TOMBOL BATAL
// ===============================

if (resetBtn) {
    resetBtn.addEventListener("click", resetAttendance);
}


// ===============================
// MULAI PRESENSI
// ===============================

async function startAttendance() {

    const nim = nimInput.value.trim();

    if (nim === "") {
        alert("Silakan masukkan NIM terlebih dahulu.");
        nimInput.focus();
        return;
    }


    // ==========================
    // MODE DEMO
    // ==========================

    if (typeof DEMO_MODE !== "undefined" && DEMO_MODE === true) {

        if (!students[nim]) {

            alert(
                "NIM tidak ditemukan.\n\n" +
                "Gunakan NIM demo berikut:\n\n" +
                "230101001\n" +
                "230101002\n" +
                "230101003\n" +
                "230101004"
            );

            return;
        }

        currentStudent = {
            nim: nim,
            name: students[nim]
        };

    } else {

        currentStudent = {
            nim: nim,
            name: "Mahasiswa"
        };
    }


    console.log("Mahasiswa:", currentStudent);


    // ==========================
    // TAMPILKAN SCANNER
    // ==========================

    hideSection(nimSection);
    hideSection(confirmationSection);
    hideSection(successSection);

    showSection(scannerSection);

    updateSteps(2);


    // Tunggu sebentar supaya
    // #reader benar-benar terlihat
    setTimeout(() => {
        startScanner();
    }, 300);
}


// ===============================
// START QR SCANNER
// ===============================

async function startScanner() {

    try {

        if (isScanning) {
            console.log("Scanner sudah berjalan.");
            return;
        }


        // ==========================
        // CEK LIBRARY
        // ==========================

        if (typeof Html5Qrcode === "undefined") {

            alert(
                "QR Scanner gagal dimuat.\n\n" +
                "Pastikan internet aktif."
            );

            console.error(
                "Html5Qrcode tidak ditemukan."
            );

            return;
        }


        console.log("Mencari kamera...");


        // ==========================
        // BERSIHKAN SCANNER LAMA
        // ==========================

        if (scanner) {

            try {
                await scanner.stop();
            } catch (error) {
                console.log(
                    "Scanner lama sudah berhenti."
                );
            }

            scanner.clear();

            scanner = null;
        }


        // ==========================
        // BUAT SCANNER BARU
        // ==========================

        scanner = new Html5Qrcode("reader");


        // ==========================
        // CARI KAMERA
        // ==========================

        const cameras =
            await Html5Qrcode.getCameras();


        if (!cameras || cameras.length === 0) {

            alert(
                "Kamera tidak ditemukan.\n\n" +
                "Pastikan browser memiliki izin menggunakan kamera."
            );

            console.error(
                "Tidak ada kamera yang ditemukan."
            );

            return;
        }


        console.log(
            "Kamera ditemukan:",
            cameras
        );


        // ==========================
        // PILIH KAMERA BELAKANG
        // ==========================

        let selectedCamera = cameras[0];


        for (const camera of cameras) {

            const label =
                camera.label.toLowerCase();

            if (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment") ||
                label.includes("belakang")
            ) {

                selectedCamera = camera;
                break;
            }
        }


        console.log(
            "Kamera digunakan:",
            selectedCamera.label
        );


        // ==========================
        // KONFIGURASI SCANNER
        // ==========================

        const config = {

            fps: 10,

            qrbox: function(
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
                    width: size,
                    height: size
                };
            },

            aspectRatio: 1.0,

            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };


        // ==========================
        // MULAI KAMERA
        // ==========================

        await scanner.start(

            selectedCamera.id,

            config,

            function(decodedText, decodedResult) {

                onScanSuccess(
                    decodedText,
                    decodedResult
                );

            },

            function(errorMessage) {

                // Jangan tampilkan alert.
                // Error ini normal ketika
                // scanner belum menemukan QR.
            }
        );


        isScanning = true;


        console.log(
            "================================"
        );

        console.log(
            "SCANNER BERHASIL DIMULAI"
        );

        console.log(
            "Silakan arahkan kamera ke QR Code."
        );

        console.log(
            "================================"
        );


    } catch (error) {

        isScanning = false;

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


// ===============================
// QR BERHASIL DIBACA
// ===============================

async function onScanSuccess(
    decodedText,
    decodedResult
) {

    if (!isScanning) {
        return;
    }


    // Cegah pembacaan berulang
    isScanning = false;


    console.log(
        "================================"
    );

    console.log(
        "QR CODE BERHASIL DIBACA!"
    );

    console.log(
        "Isi QR:"
    );

    console.log(
        decodedText
    );

    console.log(
        "================================"
    );


    await stopScanner();


    handleQRCode(decodedText);
}


// ===============================
// PROSES DATA QR
// ===============================

function handleQRCode(decodedText) {

    try {

        const qrData =
            JSON.parse(decodedText);


        console.log(
            "Data QR:",
            qrData
        );


        // ==========================
        // CEK TYPE
        // ==========================

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


        // ==========================
        // CEK DATA
        // ==========================

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


        // ==========================
        // SIMPAN SESSION
        // ==========================

        currentSession = {

            type: qrData.type,

            course: qrData.course,

            meeting: qrData.meeting,

            session: qrData.session
        };


        console.log(
            "Session berhasil:",
            currentSession
        );


        // ==========================
        // TAMPILKAN KONFIRMASI
        // ==========================

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


// ===============================
// KONFIRMASI PRESENSI
// ===============================

function showConfirmation() {

    if (!currentStudent ||
        !currentSession) {

        alert(
            "Data mahasiswa atau sesi tidak ditemukan."
        );

        return;
    }


    confirmName.textContent =
        currentStudent.name;

    confirmNim.textContent =
        currentStudent.nim;

    confirmCourse.textContent =
        currentSession.course;

    confirmMeeting.textContent =
        "Pertemuan " +
        currentSession.meeting;


    hideSection(nimSection);
    hideSection(scannerSection);
    hideSection(successSection);

    showSection(confirmationSection);

    updateSteps(3);
}


// ===============================
// SIMPAN PRESENSI
// ===============================

async function submitAttendance() {

    if (!currentStudent ||
        !currentSession) {

        alert(
            "Data presensi tidak lengkap."
        );

        return;
    }


    const now = new Date();


    const date =
        now.toLocaleDateString("id-ID");


    const time =
        now.toLocaleTimeString("id-ID");


    const attendance = {

        nim: currentStudent.nim,

        name: currentStudent.name,

        course: currentSession.course,

        meeting: currentSession.meeting,

        session: currentSession.session,

        date: date,

        time: time,

        status: "Hadir"
    };


    console.log(
        "Data presensi:",
        attendance
    );


    // ==========================
    // MODE DEMO
    // ==========================

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE === true
    ) {

        const result =
            saveDemoAttendance(
                attendance
            );


        if (!result.success) {

            alert(result.message);

            return;
        }


        showSuccess(attendance);

        return;
    }


    // ==========================
    // GOOGLE SHEETS
    // ==========================

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            attendance
                        )
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(result.message);

            return;
        }


        showSuccess(attendance);


    } catch (error) {

        console.error(
            "Error Google Sheets:",
            error
        );


        alert(
            "Gagal mengirim data presensi."
        );
    }
}


// ===============================
// SIMPAN DEMO
// ===============================

function saveDemoAttendance(
    attendance
) {

    let data =
        JSON.parse(
            localStorage.getItem(
                "attendanceData"
            )
        ) || [];


    const duplicate =
        data.some(item =>

            item.nim ===
            attendance.nim &&

            item.session ===
            attendance.session
        );


    if (duplicate) {

        return {

            success: false,

            message:
                "Anda sudah melakukan presensi pada sesi ini."
        };
    }


    data.push(attendance);


    localStorage.setItem(
        "attendanceData",
        JSON.stringify(data)
    );


    return {
        success: true
    };
}


// ===============================
// PRESENSI BERHASIL
// ===============================

function showSuccess(attendance) {

    successNim.textContent =
        attendance.nim;

    successName.textContent =
        attendance.name;

    successCourse.textContent =
        attendance.course;

    successMeeting.textContent =
        "Pertemuan " +
        attendance.meeting;


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


    hideSection(nimSection);
    hideSection(scannerSection);
    hideSection(confirmationSection);

    showSection(successSection);

    updateSteps(4);
}


// ===============================
// STOP SCANNER
// ===============================

async function stopScanner() {

    if (!scanner) {

        isScanning = false;

        return;
    }


    try {

        await scanner.stop();

        console.log(
            "Scanner dihentikan."
        );

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


    scanner = null;

    isScanning = false;
}


// ===============================
// RESTART SCANNER
// ===============================

async function restartScanner() {

    await stopScanner();


    setTimeout(
        function() {

            startScanner();

        },
        500
    );
}


// ===============================
// RESET
// ===============================

async function resetAttendance() {

    await stopScanner();


    currentStudent = null;

    currentSession = null;


    if (nimInput) {

        nimInput.value = "";
    }


    hideSection(scannerSection);

    hideSection(confirmationSection);

    hideSection(successSection);

    showSection(nimSection);


    updateSteps(1);
}


// ===============================
// SHOW SECTION
// ===============================

function showSection(section) {

    if (section) {

        section.classList.remove(
            "hidden"
        );
    }
}


// ===============================
// HIDE SECTION
// ===============================

function hideSection(section) {

    if (section) {

        section.classList.add(
            "hidden"
        );
    }
}


// ===============================
// UPDATE STEP
// ===============================

function updateSteps(step) {

    const steps =
        document.querySelectorAll(
            ".step"
        );


    steps.forEach(
        function(item, index) {

            if (index < step) {

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


// ===============================
// ENTER PADA NIM
// ===============================

if (nimInput) {

    nimInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                startAttendance();
            }
        }
    );
}


// ===============================
// DOM READY
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "================================"
        );

        console.log(
            "SMART ATTENDANCE"
        );

        console.log(
            "Aplikasi siap digunakan."
        );

        console.log(
            "DEMO_MODE:",
            typeof DEMO_MODE !== "undefined"
                ? DEMO_MODE
                : "Tidak ditemukan"
        );

        console.log(
            "================================"
        );
    }
);