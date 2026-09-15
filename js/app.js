// ======================================================
// SMART ATTENDANCE - APP.JS
// VERSI FINAL
// ======================================================


// ======================================================
// DATA MAHASISWA DEMO
// ======================================================

const students = {
    "230101001": "Teuku Ikhyar",
    "230101002": "Muhammad Rizki",
    "230101003": "Siti Aisyah",
    "230101004": "Fajar Maulana"
};


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
    document.getElementById("nimSection");

const scannerSection =
    document.getElementById("scannerSection");

const confirmationSection =
    document.getElementById("confirmationSection");

const successSection =
    document.getElementById("successSection");


const nimInput =
    document.getElementById("nimInput");

const continueBtn =
    document.getElementById("continueBtn");


const confirmNim =
    document.getElementById("confirmNim");

const confirmName =
    document.getElementById("confirmName");

const confirmCourse =
    document.getElementById("confirmCourse");

const confirmMeeting =
    document.getElementById("confirmMeeting");


const submitBtn =
    document.getElementById("submitBtn");

const resetBtn =
    document.getElementById("resetBtn");


const successNim =
    document.getElementById("successNim");

const successName =
    document.getElementById("successName");

const successCourse =
    document.getElementById("successCourse");

const successMeeting =
    document.getElementById("successMeeting");

const successDate =
    document.getElementById("successDate");

const successTime =
    document.getElementById("successTime");

const successSession =
    document.getElementById("successSession");


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
        nimInput.value.trim();


    // ==================================================
    // CEK NIM KOSONG
    // ==================================================

    if (nim === "") {

        alert(
            "Silakan masukkan NIM terlebih dahulu."
        );

        nimInput.focus();

        return;
    }


    // ==================================================
    // MODE DEMO
    // ==================================================

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE === true
    ) {

        // ----------------------------------------------
        // CEK NIM DEMO
        // ----------------------------------------------

        if (!students[nim]) {

            alert(
                "NIM tidak ditemukan.\n\n" +
                "Gunakan salah satu NIM demo berikut:\n\n" +
                "230101001\n" +
                "230101002\n" +
                "230101003\n" +
                "230101004"
            );

            return;
        }


        // ----------------------------------------------
        // SIMPAN DATA MAHASISWA
        // ----------------------------------------------

        currentStudent = {

            nim: nim,

            name: students[nim]

        };


    } else {

        // ==================================================
        // MODE ONLINE
        // AMBIL DATA MAHASISWA DARI GOOGLE SHEETS
        // ==================================================

        try {

            // ----------------------------------------------
            // CEK API URL
            // ----------------------------------------------

            if (
                typeof API_URL === "undefined" ||
                !API_URL ||
                API_URL.includes("MASUKKAN_URL")
            ) {

                alert(
                    "API Google Apps Script belum diatur."
                );

                return;
            }


            console.log(
                "Mencari mahasiswa dengan NIM:",
                nim
            );


            console.log(
                "API URL:",
                API_URL
            );


            // ----------------------------------------------
            // REQUEST DATA MAHASISWA
            // ----------------------------------------------

            const response =
                await fetch(
                    API_URL +
                    "?action=student&nim=" +
                    encodeURIComponent(nim)
                );


            // ----------------------------------------------
            // CEK RESPONSE
            // ----------------------------------------------

            if (!response.ok) {

                throw new Error(
                    "Server mengembalikan status " +
                    response.status
                );

            }


            // ----------------------------------------------
            // BACA JSON
            // ----------------------------------------------

            const result =
                await response.json();


            console.log(
                "Response mahasiswa:",
                result
            );


            // ----------------------------------------------
            // CEK DATA MAHASISWA
            // ----------------------------------------------

            if (
                !result.success ||
                !result.data
            ) {

                alert(
                    "NIM tidak ditemukan di Google Sheets.\n\n" +
                    "Pastikan NIM sudah terdaftar di sheet Mahasiswa."
                );

                return;
            }


            // ----------------------------------------------
            // SIMPAN DATA MAHASISWA
            // ----------------------------------------------

            currentStudent = {

                nim:
                    result.data.nim,

                name:
                    result.data.name,

                class:
                    result.data.class || ""

            };


            console.log(
                "Mahasiswa ditemukan:",
                currentStudent
            );


            // ----------------------------------------------
            // CEK NAMA
            // ----------------------------------------------

            if (
                !currentStudent.name
            ) {

                alert(
                    "Nama mahasiswa tidak ditemukan.\n\n" +
                    "Periksa kolom Nama pada sheet Mahasiswa."
                );

                return;
            }


        } catch (error) {

            console.error(
                "ERROR DATA MAHASISWA:",
                error
            );


            alert(
                "Gagal mengambil data mahasiswa dari Google Sheets.\n\n" +
                "Periksa koneksi internet dan konfigurasi Google Apps Script."
            );

            return;
        }
    }


    // ==================================================
    // TAMPILKAN DATA MAHASISWA DI CONSOLE
    // ==================================================

    console.log(
        "Mahasiswa:",
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


    // ==================================================
    // BERIKAN WAKTU UNTUK SCANNER
    // ==================================================

    setTimeout(
        function () {

            startScanner();

        },
        300
    );
}


// ======================================================
// START QR SCANNER
// ======================================================

async function startScanner() {

    try {

        // ==================================================
        // CEK SCANNER SUDAH BERJALAN
        // ==================================================

        if (isScanning) {

            return;
        }


        // ==================================================
        // CEK LIBRARY
        // ==================================================

        if (
            typeof Html5Qrcode === "undefined"
        ) {

            alert(
                "QR Scanner gagal dimuat.\n\n" +
                "Pastikan koneksi internet aktif."
            );

            console.error(
                "Html5Qrcode tidak ditemukan."
            );

            return;
        }


        // ==================================================
        // CEK ELEMENT READER
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
                "Pastikan browser memiliki izin menggunakan kamera."
            );

            return;
        }


        console.log(
            "Kamera ditemukan:",
            cameras
        );


        // ==================================================
        // PILIH KAMERA BELAKANG
        // ==================================================

        let selectedCamera =
            cameras[0];


        for (
            const camera of cameras
        ) {

            const label =
                (
                    camera.label || ""
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


        console.log(
            "Kamera digunakan:",
            selectedCamera.label
        );


        // ==================================================
        // KONFIGURASI SCANNER
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

                        width: size,

                        height: size

                    };

                },


            aspectRatio: 1.0,


            formatsToSupport: [

                Html5QrcodeSupportedFormats.QR_CODE

            ]

        };


        // ==================================================
        // MULAI KAMERA
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


            function (
                errorMessage
            ) {

                // QR belum ditemukan.
                // Tidak perlu menampilkan pesan.

            }

        );


        isScanning = true;


        console.log(
            "Scanner berhasil dimulai."
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


    // ==================================================
    // CEGAH QR TERBACA BERKALI-KALI
    // ==================================================

    isScanning = false;


    console.log(
        "QR CODE BERHASIL DIBACA!"
    );


    console.log(
        "Isi QR:",
        decodedText
    );


    // ==================================================
    // MATIKAN SCANNER
    // ==================================================

    await stopScanner();


    // ==================================================
    // PROSES QR
    // ==================================================

    handleQRCode(
        decodedText
    );

}


// ======================================================
// PROSES DATA QR
// ======================================================

function handleQRCode(
    decodedText
) {

    try {

        // ==================================================
        // UBAH QR MENJADI JSON
        // ==================================================

        const qrData =
            JSON.parse(
                decodedText
            );


        console.log(
            "Data QR:",
            qrData
        );


        // ==================================================
        // CEK TYPE QR
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
        // CEK DATA QR
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
            "Session berhasil:",
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
// TAMPILKAN KONFIRMASI PRESENSI
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
    // ISI DATA KONFIRMASI
    // ==================================================

    confirmName.textContent =
        currentStudent.name;


    confirmNim.textContent =
        currentStudent.nim;


    confirmCourse.textContent =
        currentSession.course;


    confirmMeeting.textContent =
        "Pertemuan " +
        currentSession.meeting;


    // ==================================================
    // ATUR TAMPILAN
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

    // ==================================================
    // CEK DATA
    // ==================================================

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

        submitBtn.disabled = true;

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
    // MODE DEMO
    // ==================================================

    if (
        typeof DEMO_MODE !== "undefined" &&
        DEMO_MODE === true
    ) {

        const result =
            saveDemoAttendance(
                attendance
            );


        if (
            !result.success
        ) {

            alert(
                result.message
            );


            enableSubmitButton();


            return;
        }


        showSuccess(
            attendance
        );


        enableSubmitButton();


        return;
    }


    // ==================================================
    // MODE ONLINE
    // GOOGLE SHEETS
    // ==================================================

    try {

        // ==================================================
        // CEK API URL
        // ==================================================

        if (
            typeof API_URL === "undefined" ||
            !API_URL ||
            API_URL.includes("MASUKKAN_URL")
        ) {

            alert(
                "API Google Apps Script belum diatur."
            );


            enableSubmitButton();


            return;
        }


        console.log(
            "Mengirim data ke Google Sheets..."
        );


        console.log(
            "API URL:",
            API_URL
        );


        // ==================================================
        // KIRIM DATA KE GOOGLE APPS SCRIPT
        // ==================================================
        //
        // mode no-cors digunakan agar request POST
        // tidak terkena CORS preflight.
        //
        // Jangan menambahkan Content-Type.
        //
        // ==================================================

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


        // ==================================================
        // CATAT BERHASIL
        // ==================================================

        console.log(
            "Data berhasil dikirim ke Google Apps Script."
        );


        // ==================================================
        // TAMPILKAN SUKSES
        // ==================================================

        showSuccess(
            attendance
        );


    } catch (error) {

        console.error(
            "Error Google Sheets:",
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
// AKTIFKAN KEMBALI TOMBOL SUBMIT
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
// SIMPAN PRESENSI MODE DEMO
// ======================================================

function saveDemoAttendance(
    attendance
) {

    let data = [];


    try {

        // ==================================================
        // AMBIL DATA HISTORY
        // ==================================================

        const saved =
            localStorage.getItem(
                "attendanceHistory"
            );


        if (saved) {

            data =
                JSON.parse(
                    saved
                ) || [];

        }


        // ==================================================
        // MIGRASI DATA LAMA
        // ==================================================

        if (
            data.length === 0
        ) {

            const oldData =
                localStorage.getItem(
                    "attendanceData"
                );


            if (oldData) {

                try {

                    data =
                        JSON.parse(
                            oldData
                        ) || [];

                } catch (error) {

                    data = [];

                }

            }

        }


    } catch (error) {

        console.error(
            "Gagal membaca localStorage:",
            error
        );


        data = [];

    }


    // ==================================================
    // CEK DUPLIKAT
    // ==================================================

    const duplicate =
        data.some(

            item =>

                String(
                    item.nim
                ) ===
                String(
                    attendance.nim
                )

                &&

                String(
                    item.session
                ) ===
                String(
                    attendance.session
                )

        );


    if (duplicate) {

        return {

            success:
                false,

            message:
                "Anda sudah melakukan presensi pada sesi ini."

        };

    }


    // ==================================================
    // TAMBAHKAN DATA
    // ==================================================

    data.push(
        attendance
    );


    // ==================================================
    // SIMPAN LOCAL STORAGE
    // ==================================================

    localStorage.setItem(

        "attendanceHistory",

        JSON.stringify(
            data
        )

    );


    console.log(
        "Riwayat berhasil disimpan:",
        data
    );


    return {

        success:
            true

    };

}


// ======================================================
// TAMPILKAN PRESENSI BERHASIL
// ======================================================

function showSuccess(
    attendance
) {

    // ==================================================
    // ISI DATA
    // ==================================================

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


    // ==================================================
    // ATUR TAMPILAN
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

        isScanning = false;

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


    scanner = null;

    isScanning = false;

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
// RESET PRESENSI
// ======================================================

async function resetAttendance() {

    await stopScanner();


    // ==================================================
    // HAPUS DATA SEMENTARA
    // ==================================================

    currentStudent =
        null;


    currentSession =
        null;


    // ==================================================
    // KOSONGKAN NIM
    // ==================================================

    if (nimInput) {

        nimInput.value =
            "";

    }


    // ==================================================
    // AKTIFKAN KEMBALI TOMBOL
    // ==================================================

    enableSubmitButton();


    // ==================================================
    // ATUR TAMPILAN
    // ==================================================

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
// ENTER PADA INPUT NIM
// ======================================================

if (nimInput) {

    nimInput.addEventListener(

        "keydown",

        function (event) {

            if (
                event.key === "Enter"
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