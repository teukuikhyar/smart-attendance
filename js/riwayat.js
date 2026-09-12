// ==========================================
// SMART ATTENDANCE - RIWAYAT.JS
// ==========================================


// ==========================================
// ELEMENT HTML
// ==========================================

const searchNim =
    document.getElementById("searchNim");

const historyTable =
    document.getElementById("historyTable");


// ==========================================
// DATA RIWAYAT
// ==========================================

let attendanceHistory = [];


// ==========================================
// LOAD SAAT HALAMAN DIBUKA
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Halaman Riwayat siap digunakan."
        );

        loadHistory();

    }
);


// ==========================================
// LOAD DATA RIWAYAT
// ==========================================

async function loadHistory() {

    // ======================================
    // DEMO MODE
    // ======================================

    if (DEMO_MODE) {

        loadDemoHistory();

        return;
    }


    // ======================================
    // MODE ONLINE
    // ======================================

    await loadOnlineHistory();

}


// ==========================================
// LOAD DATA DEMO
// ==========================================

function loadDemoHistory() {

    try {

        attendanceHistory =
            JSON.parse(
                localStorage.getItem(
                    "attendanceHistory"
                )
            ) || [];

    }

    catch (error) {

        console.error(
            "Gagal membaca riwayat:",
            error
        );

        attendanceHistory = [];

    }


    displayHistory(
        attendanceHistory
    );

}


// ==========================================
// LOAD DATA DARI GOOGLE SHEETS
// ==========================================

async function loadOnlineHistory() {

    if (
        !API_URL ||
        API_URL.includes(
            "MASUKKAN_URL"
        )
    ) {

        console.warn(
            "API_URL belum diatur."
        );

        displayHistory([]);

        return;
    }


    try {

        const response =
            await fetch(
                API_URL
            );


        const result =
            await response.json();


        console.log(
            "Data dari server:",
            result
        );


        if (!result.success) {

            alert(
                result.message ||
                "Gagal mengambil data presensi."
            );

            displayHistory([]);

            return;
        }


        attendanceHistory =
            result.data || [];


        displayHistory(
            attendanceHistory
        );

    }

    catch (error) {

        console.error(
            "Gagal mengambil data:",
            error
        );


        alert(
            "Tidak dapat mengambil data presensi dari server."
        );


        displayHistory([]);

    }

}


// ==========================================
// TAMPILKAN DATA KE TABEL
// ==========================================

function displayHistory(
    data
) {

    if (!historyTable) {

        console.error(
            "historyTable tidak ditemukan."
        );

        return;
    }


    // ======================================
    // KOSONGKAN TABEL
    // ======================================

    historyTable.innerHTML = "";


    // ======================================
    // CEK DATA KOSONG
    // ======================================

    if (
        !data ||
        data.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 7;


        cell.className =
            "empty-table";


        cell.textContent =
            "Belum ada data presensi.";


        row.appendChild(
            cell
        );


        historyTable.appendChild(
            row
        );


        return;
    }


    // ======================================
    // TAMPILKAN DATA
    // ======================================

    data.forEach(
        function (item) {

            const row =
                document.createElement(
                    "tr"
                );


            // ==================================
            // NIM
            // ==================================

            const nimCell =
                document.createElement(
                    "td"
                );

            nimCell.textContent =
                item.nim || "-";


            // ==================================
            // NAMA
            // ==================================

            const nameCell =
                document.createElement(
                    "td"
                );

            nameCell.textContent =
                item.name || "-";


            // ==================================
            // MATA KULIAH
            // ==================================

            const courseCell =
                document.createElement(
                    "td"
                );

            courseCell.textContent =
                item.course || "-";


            // ==================================
            // PERTEMUAN
            // ==================================

            const meetingCell =
                document.createElement(
                    "td"
                );

            meetingCell.textContent =
                item.meeting
                    ? "Pertemuan " +
                      item.meeting
                    : "-";


            // ==================================
            // TANGGAL
            // ==================================

            const dateCell =
                document.createElement(
                    "td"
                );

            dateCell.textContent =
                item.date || "-";


            // ==================================
            // WAKTU
            // ==================================

            const timeCell =
                document.createElement(
                    "td"
                );

            timeCell.textContent =
                item.time || "-";


            // ==================================
            // STATUS
            // ==================================

            const statusCell =
                document.createElement(
                    "td"
                );


            const statusBadge =
                document.createElement(
                    "span"
                );


            statusBadge.className =
                "status-badge";


            statusBadge.textContent =
                item.status || "Hadir";


            statusCell.appendChild(
                statusBadge
            );


            // ==================================
            // MASUKKAN CELL KE ROW
            // ==================================

            row.appendChild(
                nimCell
            );

            row.appendChild(
                nameCell
            );

            row.appendChild(
                courseCell
            );

            row.appendChild(
                meetingCell
            );

            row.appendChild(
                dateCell
            );

            row.appendChild(
                timeCell
            );

            row.appendChild(
                statusCell
            );


            // ==================================
            // MASUKKAN ROW KE TABLE
            // ==================================

            historyTable.appendChild(
                row
            );

        }
    );

}


// ==========================================
// PENCARIAN NIM
// ==========================================

if (searchNim) {

    searchNim.addEventListener(
        "input",
        searchHistory
    );

}


// ==========================================
// FUNGSI SEARCH
// ==========================================

function searchHistory() {

    const keyword =
        searchNim.value
            .trim()
            .toLowerCase();


    // ======================================
    // JIKA PENCARIAN KOSONG
    // ======================================

    if (keyword === "") {

        displayHistory(
            attendanceHistory
        );

        return;
    }


    // ======================================
    // FILTER DATA
    // ======================================

    const filtered =
        attendanceHistory.filter(
            function (item) {

                const nim =
                    String(
                        item.nim || ""
                    )
                    .toLowerCase();


                const name =
                    String(
                        item.name || ""
                    )
                    .toLowerCase();


                const course =
                    String(
                        item.course || ""
                    )
                    .toLowerCase();


                return (
                    nim.includes(keyword) ||
                    name.includes(keyword) ||
                    course.includes(keyword)
                );

            }
        );


    // ======================================
    // TAMPILKAN HASIL
    // ======================================

    displayHistory(
        filtered
    );

}