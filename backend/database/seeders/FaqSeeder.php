<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing FAQs before re-seeding
        Faq::truncate();

        $faqs = [
            // ── Paket & Harga ───────────────────────────────────────────────
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Bedanya paket tanpa print sama unlimited print apa?',
                'jawaban'    => 'Paket Tanpa Print: tamu bisa foto sepuasnya, hasil foto diberikan secara digital berupa soft file foto satuan, foto dengan template frame, dan GIF bergerak — bisa diakses lewat scan QR/link unik per tamu. Paket Unlimited Photo & Print: sama seperti tanpa print tapi ditambah cetak foto langsung di lokasi sepuasnya, dan tamu bisa request tambah cetak.',
            ],
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Untuk acara lebih dari 3 jam bisa?',
                'jawaban'    => 'Bisa dengan add-on extra hour. Biaya extra hour adalah Rp 450.000/jam. Extra hour bisa ditambah saat booking atau menyusul di hari H tergantung ketersediaan jadwal kami di hari tersebut.',
            ],
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Bisa extra hour menyusul setelah acara berjalan?',
                'jawaban'    => 'Bisa, tergantung jadwal booking kami di hari yang sama. Silakan konfirmasi ke tim kami saat acara berlangsung.',
            ],
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Hasil print bisa lebih dari satu lembar per sesi?',
                'jawaban'    => 'Bisa, paket Unlimited Print memungkinkan cetak berulang/tambah cetak tanpa batas.',
            ],
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Biasanya dalam waktu 3 jam bisa berapa kali sesi foto?',
                'jawaban'    => 'Sekitar 150 sesi foto dalam 3 jam, tergantung antrian dan jumlah tamu.',
            ],
            [
                'kategori'   => 'paket',
                'pertanyaan' => 'Bisa pakai lebih dari 1 template frame?',
                'jawaban'    => 'Bisa, namun ada biaya tambahan desain dan input frame sebesar Rp 50.000 per template tambahan.',
            ],

            // ── Transport ───────────────────────────────────────────────────
            [
                'kategori'   => 'transport',
                'pertanyaan' => 'Biaya transport include atau berbayar?',
                'jawaban'    => 'Gratis untuk acara dalam radius 20km dari base kami di Bekasi Utara. Di atas 20km dikenakan biaya tambahan: 20–35km = Rp 100.000, 35–50km = Rp 200.000. Lebih dari 50km hubungi kami untuk estimasi.',
            ],
            [
                'kategori'   => 'transport',
                'pertanyaan' => 'Lokasi base / kantor dimana?',
                'jawaban'    => 'Base kami di Bekasi Utara. Kunjungan ke kantor bisa dengan jadwal yang telah didiskusikan terlebih dahulu.',
            ],

            // ── Desain & Frame ──────────────────────────────────────────────
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Bisa custom design frame? Revisi berapa kali?',
                'jawaban'    => 'Ya, custom design frame sudah termasuk dalam harga paket. Revisi maksimal 3x. Customer akan mendapat preview desain dan bisa minta revisi sebelum dipakai di acara.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Kalau mau buat design frame sendiri bisa?',
                'jawaban'    => 'Bisa, kami akan kirimkan template ukuran frame supaya desain yang dibuat sesuai spesifikasi. Setelah jadi tinggal kirim ke kami.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Design frame bisa sesuai tema acara?',
                'jawaban'    => 'Bisa, tim desainer kami akan menyesuaikan frame dengan tema, warna, dan konsep acara kamu.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Kalau design frame jadi, bisa lihat preview dulu?',
                'jawaban'    => 'Bisa, customer akan mendapat preview desain dan bisa revisi maksimal 3x sebelum hari H.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Bisa hapus logo atau tambah logo perusahaan di frame?',
                'jawaban'    => 'Bisa keduanya — bisa hapus logo default maupun tambahkan logo perusahaan/brand kamu ke dalam desain frame.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Cover frame bisa request design?',
                'jawaban'    => 'Kami tidak menggunakan cover frame. Untuk hasil cetak foto, kami menyediakan plastik pelindung.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Untuk layout twincut bisa dibuat horizontal?',
                'jawaban'    => 'Bisa, layout twincut bisa dibuat horizontal sesuai permintaan.',
            ],
            [
                'kategori'   => 'desain',
                'pertanyaan' => 'Maksudnya twincut seperti apa?',
                'jawaban'    => 'Twincut adalah hasil cetak yang berisi 2 lembar foto sekaligus dalam satu kertas cetak, kemudian dipotong menjadi 2.',
            ],

            // ── Teknis & Operasional ────────────────────────────────────────
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Berapa watt listrik yang dibutuhkan?',
                'jawaban'    => 'Kurang lebih 200–350 watt. Perlu ada stop kontak di dekat area photobooth.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Perlu meja dan kursi?',
                'jawaban'    => 'Ya, dibutuhkan 1 meja dan 1 kursi di area photobooth.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Berapa luas area yang dibutuhkan?',
                'jawaban'    => 'Minimal 2x2 meter. Semakin luas semakin baik, karena bisa menampung lebih banyak tamu sekaligus.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Bisa berapa orang paling banyak foto bersamaan?',
                'jawaban'    => 'Di space minimal 2x2 meter bisa maksimal 5 orang. Semakin luas areanya, semakin banyak yang bisa foto sekaligus.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Ada berapa crew yang jaga?',
                'jawaban'    => '1 crew profesional yang akan standby selama durasi sewa.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Jenis kamera yang dipakai apa?',
                'jawaban'    => 'Kamera DSLR untuk kualitas foto terbaik.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Bisa foto pakai filter seperti black & white?',
                'jawaban'    => 'Bisa, tersedia berbagai pilihan filter termasuk black & white.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Tamu bisa retake foto?',
                'jawaban'    => 'Bisa, tamu bisa retake jika hasilnya kurang memuaskan.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Hasil foto bisa pakai barcode atau QR?',
                'jawaban'    => 'Bisa, setiap tamu akan mendapatkan link/QR unik untuk mengakses foto mereka sendiri — tidak tercampur dengan tamu lain.',
            ],
            [
                'kategori'   => 'teknis',
                'pertanyaan' => 'Maksudnya GIF itu apa?',
                'jawaban'    => 'GIF adalah format gambar bergerak (animasi), seperti video pendek tanpa suara. Ini salah satu output digital yang didapat selain foto satuan dan foto dengan frame.',
            ],

            // ── Backdrop & Properti ─────────────────────────────────────────
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Backdrop tersedia warna apa saja?',
                'jawaban'    => 'Tersedia backdrop kain sequin warna hitam, silver, gold, dan maroon.',
            ],
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Bisa custom backdrop?',
                'jawaban'    => 'Tidak bisa custom backdrop dari kami. Jika ingin backdrop custom, silakan koordinasikan dengan vendor dekorasi pilihan kamu, kami bisa menyesuaikan.',
            ],
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Bisa photobooth pakai backdrop sendiri dari customer?',
                'jawaban'    => 'Bisa, customer bisa menyediakan backdrop sendiri dan kami akan menyesuaikan setup.',
            ],
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Kalau tidak pakai backdrop, ada pengurangan biaya?',
                'jawaban'    => 'Tidak ada pengurangan biaya, karena backdrop adalah fasilitas tambahan yang sudah kami siapkan tanpa biaya ekstra.',
            ],
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Properti yang disediakan apa saja?',
                'jawaban'    => 'Properti standar berupa bando, kacamata, topi, dan aksesoris lucu lainnya.',
            ],
            [
                'kategori'   => 'properti',
                'pertanyaan' => 'Bisa custom properti seperti tulisan, logo, atau topeng?',
                'jawaban'    => 'Bisa, properti custom tersedia dengan biaya disesuaikan berdasarkan jenis dan desain properti. Hubungi kami untuk estimasi harga.',
            ],

            // ── Logistik & Jadwal ───────────────────────────────────────────
            [
                'kategori'   => 'logistik',
                'pertanyaan' => 'Set up berapa lama? Crew datang jam berapa?',
                'jawaban'    => 'Setup membutuhkan waktu sekitar 30 menit. Crew kami tiba maksimal 1 jam sebelum waktu sewa photobooth dimulai.',
            ],
            [
                'kategori'   => 'logistik',
                'pertanyaan' => 'Waktu sewa dihitung dari jam set up atau jam mulai foto?',
                'jawaban'    => 'Tidak, waktu set up di luar dari jam sewa. Hitungan mulai saat photobooth siap digunakan tamu, bukan dari saat kami tiba.',
            ],
            [
                'kategori'   => 'logistik',
                'pertanyaan' => 'Loading barang bisa H-1 atau beberapa jam sebelum acara?',
                'jawaban'    => 'Loading barang tidak bisa H-1. Perlengkapan kami cukup ringkas sehingga bisa dilakukan di hari H, minimal 1 jam sebelum acara dimulai.',
            ],
            [
                'kategori'   => 'logistik',
                'pertanyaan' => 'Kalau acaranya dipotong sesi kirab, dihitung terpotong atau tidak?',
                'jawaban'    => 'Terpotong. Tim akan mengikuti durasi sewa yang telah ditentukan. Jika ada jeda acara, disarankan untuk mengatur jadwal dengan bijak.',
            ],
            [
                'kategori'   => 'logistik',
                'pertanyaan' => 'Bisa pause / split hour?',
                'jawaban'    => 'Bisa jika durasi sewa lebih dari 3 jam, namun terdapat biaya extra untuk staff selama jeda berlangsung. Hubungi kami untuk detail.',
            ],

            // ── Pernikahan / Wedding ────────────────────────────────────────
            [
                'kategori'   => 'wedding',
                'pertanyaan' => 'Pengantin boleh foto duluan atau di akhir sesi?',
                'jawaban'    => 'Boleh keduanya — bisa foto duluan di awal maupun di akhir sesi. Perlu koordinasi antara WO/MC dengan tim vendor photobooth kami.',
            ],
            [
                'kategori'   => 'wedding',
                'pertanyaan' => 'Kalau mau photobooth ada saat akad dan resepsi, baiknya jam berapa?',
                'jawaban'    => 'Disarankan di pertengahan waktu antara akad dan resepsi agar momen keduanya bisa tercakup.',
            ],

            // ── Pembayaran & Administrasi ───────────────────────────────────
            [
                'kategori'   => 'pembayaran',
                'pertanyaan' => 'Sistem pembayaran seperti apa?',
                'jawaban'    => 'Pembayaran melalui transfer ke rekening BCA 5212181994 atas nama PT POONYA KITA BERSAMA. DP 50% untuk konfirmasi booking, pelunasan maksimal H-1 acara.',
            ],
            [
                'kategori'   => 'pembayaran',
                'pertanyaan' => 'Boleh lunasi saat hari H?',
                'jawaban'    => 'Tidak bisa, pelunasan paling lambat H-1 sebelum acara.',
            ],
            [
                'kategori'   => 'pembayaran',
                'pertanyaan' => 'Biaya gedung ada charge dari pihak photobooth?',
                'jawaban'    => 'Tidak ada charge dari kami untuk biaya gedung. Namun beberapa venue mengenakan biaya vendor kepada client — itu kebijakan gedung masing-masing.',
            ],
            [
                'kategori'   => 'pembayaran',
                'pertanyaan' => 'Perlu kupon untuk antrian tamu?',
                'jawaban'    => 'Tergantung jumlah peserta. Jika acara sangat ramai, disarankan menggunakan sistem kupon untuk merapikan antrian. Bisa didiskusikan saat booking.',
            ],

            // ── Hasil Foto Digital ──────────────────────────────────────────
            [
                'kategori'   => 'digital',
                'pertanyaan' => 'Apa nanti dapat seluruh file foto di akhir acara?',
                'jawaban'    => 'Ya, seluruh soft file akan dikirimkan ke pemesan berupa link download setelah acara selesai.',
            ],
            [
                'kategori'   => 'digital',
                'pertanyaan' => 'Link hasil foto tercampur semua atau per tamu?',
                'jawaban'    => 'Tidak tercampur. Setiap tamu mendapat link foto masing-masing, sehingga privasi dan kenyamanan tamu tetap terjaga.',
            ],
        ];

        foreach ($faqs as $i => $data) {
            Faq::create([
                'pertanyaan' => $data['pertanyaan'],
                'jawaban'    => $data['jawaban'],
                'kategori'   => $data['kategori'],
                'urutan'     => ($i + 1) * 10,
                'aktif'      => true,
            ]);
        }

        $this->command->info('FAQ seeded: ' . count($faqs) . ' entries.');
    }
}
