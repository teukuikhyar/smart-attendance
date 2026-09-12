// ==========================================
// SMART ATTENDANCE - ADMIN.JS
// ==========================================


// ==========================================
// ELEMENT HTML
// ==========================================

const courseSelect = document.getElementById("course");
const meetingSelect = document.getElementById("meeting");

const qrContainer = document.getElementById("qrcode");
const sessionCode = document.getElementById("sessionCode");
const downloadBtn = document.getElementById("downloadQR");
const qrDescription = document.getElementById("qrDescription");


// ==========================================
// VARIABLE
// ==========================================

let currentSession = null;


// ==========================================
// GENERATE QR CODE
// ==========================================

function generateSessionQR() {

    // Pastikan element tersedia
    if (!courseSelect || !meetingSelect || !qrContainer) {

        console.error("Element admin tidak ditemukan.");

        return;
    }


    // Ambil data
    const course = courseSelect.value.trim();
    const meeting = meetingSelect.value.trim();


    // ======================================
    // VALIDASI MATA KULIAH
    // ======================================

    if (course === "") {

        alert("Silakan pilih mata kuliah terlebih dahulu.");

        courseSelect.focus();

        return;
    }


    // ======================================
    // VALIDASI PERTEMUAN
    // ======================================

    if (meeting === "") {

        alert("Silakan pilih pertemuan terlebih dahulu.");

        meetingSelect.focus();

        return;
    }


    // ======================================
    // BUAT SESSION CODE
    // ======================================

    const session = createSessionCode();


    // ======================================
    // DATA QR CODE
    // ======================================

    currentSession = {

        type: "SMART_ATTENDANCE",

        course: course,

        meeting: meeting,

        session: session

    };


    console.log("Data QR:", currentSession);


    // ======================================
    // HAPUS QR LAMA
    // ======================================

    qrContainer.innerHTML = "";


    // ======================================
    // CEK LIBRARY QR CODE
    // ======================================

    if (typeof QRCode === "undefined") {

        alert(
            "Library QR Code belum dimuat.\n\n" +
            "Pastikan koneksi internet aktif."
        );

        return;
    }


    // ======================================
    // BUAT QR CODE
    // ======================================

    try {

        new QRCode(qrContainer, {

            text: JSON.stringify(currentSession),

            width: 280,

            height: 280,

            colorDark: "#111827",

            colorLight: "#ffffff",

            correctLevel: QRCode.CorrectLevel.M

        });

    }

    catch (error) {

        console.error(
            "Gagal membuat QR:",
            error
        );

        alert(
            "Gagal membuat QR Code."
        );

        return;
    }


    // ======================================
    // TAMPILKAN SESSION CODE
    // ======================================

    if (sessionCode) {

        sessionCode.textContent = session;

    }


    // ======================================
    // TAMPILKAN DESKRIPSI
    // ======================================

    if (qrDescription) {

        qrDescription.textContent =
            course + " • Pertemuan " + meeting;

    }


    // ======================================
    // AKTIFKAN DOWNLOAD
    // ======================================

    if (downloadBtn) {

        downloadBtn.disabled = false;

    }


    // ======================================
    // SIMPAN SESSION
    // ======================================

    saveSessionDemo(currentSession);


    console.log(
        "QR Code berhasil dibuat."
    );

}


// ==========================================
// BUAT SESSION CODE
// ==========================================

function createSessionCode() {

    const now = new Date();


    const year =
        now.getFullYear();


    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");


    const day =
        String(now.getDate())
            .padStart(2, "0");


    const hour =
        String(now.getHours())
            .padStart(2, "0");


    const minute =
        String(now.getMinutes())
            .padStart(2, "0");


    const random =
        Math.floor(
            100 + Math.random() * 900
        );


    return (
        "SES-" +
        year +
        month +
        day +
        "-" +
        hour +
        minute +
        "-" +
        random
    );

}


// ==========================================
// SIMPAN SESSION DEMO
// ==========================================

function saveSessionDemo(session) {

    let sessions = [];


    try {

        sessions =
            JSON.parse(
                localStorage.getItem(
                    "attendanceSessions"
                )
            ) || [];

    }

    catch (error) {

        console.error(
            "Gagal membaca session:",
            error
        );

        sessions = [];

    }


    sessions.push({

        ...session,

        createdAt:
            new Date().toISOString()

    });


    localStorage.setItem(

        "attendanceSessions",

        JSON.stringify(sessions)

    );


    console.log(
        "Session berhasil disimpan."
    );

}


// ==========================================
// DOWNLOAD QR
// ==========================================

function downloadQR() {

    if (!currentSession) {

        alert(
            "Silakan generate QR Code terlebih dahulu."
        );

        return;
    }


    const qrImage =
        qrContainer.querySelector("img");


    const qrCanvas =
        qrContainer.querySelector("canvas");


    // ======================================
    // DOWNLOAD IMAGE
    // ======================================

    if (qrImage) {

        downloadImage(
            qrImage.src
        );

        return;
    }


    // ======================================
    // DOWNLOAD CANVAS
    // ======================================

    if (qrCanvas) {

        downloadImage(
            qrCanvas.toDataURL("image/png")
        );

        return;
    }


    alert(
        "QR Code belum siap."
    );

}


// ==========================================
// DOWNLOAD IMAGE
// ==========================================

function downloadImage(imageData) {

    const link =
        document.createElement("a");


    link.href = imageData;


    link.download =
        "QR-Presensi-" +
        currentSession.session +
        ".png";


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);

}


// ==========================================
// HALAMAN SELESAI DIMUAT
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Admin Dashboard siap digunakan."
        );


        if (downloadBtn) {

            downloadBtn.disabled = true;

        }

    }
);