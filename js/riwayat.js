// ======================================================
// SMART ATTENDANCE - RIWAYAT.JS
// ======================================================


// ======================================================
// ELEMENT
// ======================================================

const searchNim =
    document.getElementById(
        "searchNim"
    );

const historyTable =
    document.getElementById(
        "historyTable"
    );


// ======================================================
// DATA
// ======================================================

let attendanceHistory = [];


// ======================================================
// LOAD HISTORY
// ======================================================

async function loadHistory() {

    if (!historyTable) {
        return;
    }


    historyTable.innerHTML = `

        <tr>
            <td colspan="7" class="empty-table">
                Mengambil data dari Google Sheets...
            </td>
        </tr>

    `;


    try {

        if (
            typeof API_URL ===
                "undefined" ||

            !API_URL
        ) {

            throw new Error(
                "API URL belum diatur."
            );
        }


        const result =
            await getHistoryFromGoogleSheets();


        console.log(
            "Data riwayat:",
            result
        );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Gagal mengambil riwayat."
            );
        }


        attendanceHistory =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        displayHistory(
            attendanceHistory
        );


    } catch (error) {

        console.error(
            "ERROR RIWAYAT:",
            error
        );


        historyTable.innerHTML = `

            <tr>
                <td colspan="7" class="empty-table">
                    Gagal mengambil data dari Google Sheets.
                </td>
            </tr>

        `;
    }
}


// ======================================================
// AMBIL HISTORY GOOGLE SHEETS
// ======================================================

function getHistoryFromGoogleSheets() {

    return new Promise(

        function (
            resolve,
            reject
        ) {

            const callbackName =
                "smartAttendanceHistory_" +
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
                                "Timeout mengambil riwayat."
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


            script.src =
                API_URL +
                "?action=history" +
                "&callback=" +
                encodeURIComponent(
                    callbackName
                );


            document.body.appendChild(
                script
            );
        }
    );
}


// ======================================================
// TAMPILKAN HISTORY
// ======================================================

function displayHistory(
    data
) {

    if (!historyTable) {
        return;
    }


    // ==================================================
    // FILTER NIM
    // ==================================================

    const keyword =
        searchNim
            ? searchNim.value
                .trim()
                .toLowerCase()
            : "";


    let filtered =
        data;


    if (keyword) {

        filtered =
            data.filter(

                function (
                    item
                ) {

                    return String(
                        item["NIM"] ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        );
                }
            );
    }


    // ==================================================
    // TIDAK ADA DATA
    // ==================================================

    if (
        !filtered ||
        filtered.length === 0
    ) {

        historyTable.innerHTML = `

            <tr>
                <td colspan="7" class="empty-table">
                    Belum ada data presensi.
                </td>
            </tr>

        `;

        return;
    }


    // ==================================================
    // BUAT TABLE
    // ==================================================

    historyTable.innerHTML =
        filtered.map(

            function (
                item
            ) {

                const nim =
                    item["NIM"] || "-";


                const name =
                    item["Nama"] || "-";


                const course =
                    item["Mata Kuliah"] ||
                    "-";


                const meeting =
                    item["Pertemuan"] ||
                    "-";


                const date =
                    item["Tanggal"] ||
                    "-";


                const time =
                    item["Waktu"] ||
                    "-";


                const status =
                    item["Status"] ||
                    "Hadir";


                return `

                    <tr>

                        <td>
                            ${escapeHtml(nim)}
                        </td>

                        <td>
                            ${escapeHtml(name)}
                        </td>

                        <td>
                            ${escapeHtml(course)}
                        </td>

                        <td>
                            Pertemuan
                            ${escapeHtml(meeting)}
                        </td>

                        <td>
                            ${escapeHtml(date)}
                        </td>

                        <td>
                            ${escapeHtml(time)}
                        </td>

                        <td>
                            <span class="status-hadir">
                                ${escapeHtml(status)}
                            </span>
                        </td>

                    </tr>

                `;
            }
        ).join("");
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ======================================================
// SEARCH NIM
// ======================================================

if (searchNim) {

    searchNim.addEventListener(

        "input",

        function () {

            displayHistory(
                attendanceHistory
            );
        }
    );
}


// ======================================================
// LOAD SAAT HALAMAN DIBUKA
// ======================================================

document.addEventListener(

    "DOMContentLoaded",

    function () {

        loadHistory();

    }
);