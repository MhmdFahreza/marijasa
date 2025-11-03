// app/data/dataContent.ts
export type ContentSection = {
  text?: string;
  imageUrl?: string;
};

export type CardDataItem = {
  category: string;
  title: string;
  src: string;
  sections?: ContentSection[];
  text?: string;
  imageUrl?: string;
};

export const cardData: CardDataItem[] = [
  {
    category: "Jasa",
    title: "Tukang Listrik",
    src: "/tukanglistrik.jpg",
    sections: [
      {
        text:
          "1. Instalasi Listrik Baru: Layanan ini mencakup pemasangan sistem kelistrikan dari awal, biasanya pada rumah baru atau bangunan yang baru selesai dibangun.",
        imageUrl: "/tukanglistrik.jpg",
      },
      {
        text:
          "2. Perbaikan dan Pemeliharaan: Jenis jasa ini berfokus pada perbaikan gangguan listrik yang sudah ada, seperti listrik yang sering padam, MCB turun, kabel terbakar, atau korsleting.",
        imageUrl: "/tukanglistrik.jpg",
      },
      {
        text:
          "3. Penambahan Titik Listrik: Sering kali penghuni rumah memerlukan tambahan stopkontak atau titik lampu di lokasi tertentu. Tukang listrik dapat menambah titik listrik baru tanpa perlu membongkar seluruh instalasi lama.",
        imageUrl: "/tukanglistrik.jpg",
      },
      {
        text:
          "4. Pengecekan dan Sertifikasi Keamanan: Jasa ini dilakukan untuk memastikan instalasi listrik rumah dalam kondisi aman dan efisien. Tukang listrik akan memeriksa grounding, kapasitas kabel terhadap beban, serta kinerja MCB atau ELCB.",
        imageUrl: "/tukanglistrik.jpg",
      },
      {
        text:
          "5. Pemasangan Perangkat Elektronik dan Smart Home: Layanan ini mencakup pemasangan berbagai perangkat modern yang terhubung ke sistem listrik rumah, seperti CCTV, lampu otomatis, interkom, bel pintu, dan sistem smart home yang bisa dikendalikan melalui ponsel.",
        imageUrl: "/tukanglistrik.jpg",
      },
      {
        text:
          "6. Pemasangan Panel Surya atau Backup Power: Tukang listrik juga menyediakan jasa pemasangan panel surya, inverter, baterai penyimpanan, maupun genset rumah tangga.",
        imageUrl: "/tukanglistrik.jpg",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang AC",
    src: "/tukangac.jpg",
    sections: [
      {
        text:
          "1. Instalasi AC Baru: Dimulai dari survei ruangan untuk menentukan kapasitas (BTU) yang pas, posisi indoor–outdoor, jalur pipa tembaga dan pembuangan air. Pemasangan mencakup bracket, penarikan pipa + kabel, flare fitting, vakum sistem, uji kebocoran, dan komisioning sampai unit dingin stabil.",
        imageUrl: "/tukangac.jpg",
      },
      {
        text: "2. Servis Cuci & Perawatan Berkala: Pembersihan evaporator (indoor), blower, saringan, dan talang drain untuk mencegah bau dan bocor; semprotan kondensor (outdoor) supaya pembuangan panas lancar; pengecekan tekanan, arus kerja, dan suhu.",
        imageUrl: "/tukangac.jpg",
      },
      {
        text: "3. Perbaikan Gangguan/Repair: Menangani AC kurang dingin, bocor air, bunyi berisik, sering trip MCB, sampai error pada PCB. Komponen yang sering ditangani: kapasitor, motor kipas, sensor suhu, kontaktor, termistor, sampai perbaikan jalur listrik dan penggantian thermostat/remote receiver.",
        imageUrl: "/tukangac.jpg",
      },
      {
        text: "4. Penanganan Refrigeran (R32/R410A) & Kebocoran: Deteksi bocor (bubble test, nitrogen pressure test), brazing/penyolderan ulang pipa, vakum hingga mikron memadai, lalu isi ulang refrigeran sesuai spesifikasi pabrikan dengan timbangan. Termasuk recovery refrigeran lama secara aman dan sesuai prosedur.",
        imageUrl: "/tukangac.jpg",
      },
      {
        text: "5. Penanganan Refrigeran (R32/R410A) & Kebocoran: Membongkar unit lama, memindahkan ke lokasi/rumah lain, memperpanjang atau merapikan jalur pipa, mengganti insulasi, menata ulang pembuangan air, dan komisioning ulang. Umumnya diakhiri dengan top-up refrigeran jika panjang pipa berubah.",
        imageUrl: "/tukangac.jpg",
      },
      {
        text: "6. Optimasi Efisiensi & Upgrade: Audit beban ruangan, perbaikan airflow dan penambahan insulasi pipa, penyetelan thermostat dan mode hemat, hingga konsultasi upgrade ke unit inverter/multi-split agar tagihan listrik lebih rendah dan suhu lebih stabil.",
        imageUrl: "/tukangac.jpg",
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Pembersihan Rumah",
    src: "/tukangbersih.jpg",
    sections: [
      {
        text:
          "1. Pembersihan Rutin (Regular Cleaning): Fokus menjaga kebersihan harian/mingguan: menyapu–mengepel lantai, mengelap debu permukaan, membersihkan kamar mandi ringan, dapur ringan (countertop, kompor, bak cuci), merapikan kamar, mengganti sprei jika diminta, dan membuang sampah. Cocok untuk rumah yang sudah rapi tetapi butuh pemeliharaan berkala.",
        imageUrl: "/tukangbersih.jpg",
      },
      {
        text:
          "2. Pembersihan Mendalam (Deep Cleaning): Membersihkan area yang jarang tersentuh seperti kolong furnitur, sudut-sudut, kisi ventilasi, sela nat, kerak kamar mandi, lemak menahun di dapur, jendela/kusen, rel pintu, serta pembersihan detail saklar/handle.",
        imageUrl: "/tukangbersih.jpg",
      },
      {
        text:
          "3. Pembersihan Pindahan (Move-In/Move-Out): Menyiapkan rumah kosong agar siap huni atau dikembalikan ke pemilik, pembersihan total debu bangunan ringan, lap dinding/daun pintu, cuci kamar mandi menyeluruh, pembersihan lemari/kabinet, jendela–kaca, dan lantai hingga bebas noda. Sering disertai fogging disinfektan opsional.",
        imageUrl: "/tukangbersih.jpg",
      },
      {
        text:
          "4. Pembersihan Pasca Renovasi (Post-Construction Cleaning): Menangani debu semen, serbuk kayu, cipratan cat, sisa grout, dan bekas perekat. Termasuk vakum industrial, pembersihan kaca/keramik dengan scraper khusus, pengelapan berulang agar debu halus benar-benar hilang, serta pengemasan dan pembuangan puing kecil sesuai prosedur.",
        imageUrl: "/tukangbersih.jpg",
      }
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Ledeng/Pipa",
    src: "/tukangledeng_pipa.jpg",
    sections: [
      {
        text: "1. Instalasi Pipa Air Bersih & Air Buangan: Pemasangan jaringan pipa dari sumber (PDAM/tandon/pompa) ke titik keran, shower, kloset, dan peralatan dapur, sekaligus jalur pembuangan (wastafel, floor drain, WC).",
        imageUrl: "/tukangledeng_pipa.jpg"
      },
      {
        text: "2. Perbaikan Kebocoran & Penanganan Darurat: Menangani pipa rembes/pecah, sambungan longgar, kran menetes, hingga talang bocor. Meliputi penelusuran titik bocor (kadang non-destruktif), penggantian fitting/union, perbaikan seal/packing, re-solder/brazing pada pipa metal, serta pemasangan stop-valve agar air bisa dimatikan per zona saat perbaikan.",
        imageUrl: "/tukangledeng_pipa.jpg"
      },
      {
        text: "3. Pelancaran Saluran Mampet (Drain Cleaning): Mengatasi sumbatan di wastafel, floor drain, kloset, dan pipa pembuangan dapur/kamar mandi. Metodenya mulai dari auger (kawat pegas), chemical yang aman, hingga high-pressure jetting untuk kerak/lemak membandel.",
        imageUrl: "/tukangledeng_pipa.jpg"
      },
      {
        text: "4. Pemasangan & Penggantian Sanitary Fixture: Pemasangan kloset duduk/jongkok, jet shower, kran mixer/panas-dingin, shower set, wastafel + siphon, floor drain anti-bau, dan aksesoris (hand shower rail, bidet spray). Teknisi memastikan alignment rapi, sealant/silikon rapat, dan tidak ada kebocoran mikro pada sambungan.",
        imageUrl: "/tukangledeng_pipa.jpg"
      },
      {
        text: "5. Sistem Pemanas, Pompa, Tandon & Tekanan Air: Instalasi water heater (listrik, gas, atau solar), mixing valve anti-scald, check valve, serta pipa air panas dengan insulasi.",
        imageUrl: "/tukangledeng_pipa.jpg"
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Sedot WC",
    src: "/tukangsedotwc.jpg",
    sections: [
      {
        text: "1. Penyedotan Septictank & Lumpur Tinja: Tim membuka manhole, mengaduk endapan agar tidak mengeras, lalu menyedot lumpur dan cairan dengan pompa vakum hingga volume yang disepakati. Biasanya disertai pengecekan sisa kapasitas dan saran interval sedot berikutnya agar tidak cepat penuh lagi.",
        imageUrl: "/tukangsedotwc.jpg"
      },
      {
        text: "2. Pelancaran WC/Saluran Mampet: Menangani kloset yang meluap atau alirannya lambat dengan auger/spiral, vakum, atau high-pressure jetting (sesuai kondisi).",
        imageUrl: "/tukangsedotwc.jpg"
      },
      {
        text: "3. Inspeksi & Diagnostik: Memetakan posisi septictank/bak kontrol, mengukur level lumpur (sludge level), mengecek pipa inlet–outlet serta ventilasi.",
        imageUrl: "/tukangsedotwc.jpg"
      },
      {
        text: "4. Perbaikan Komponen Tanki & Pipa: Perapihan bibir manhole dan tutup, perbaikan retak/pori dengan waterproofing, penggantian pipa inlet/outlet yang miring/tersumbat, pemasangan backflow valve dan rubber seal agar aliran balik serta rembesan ke tanah bisa dicegah.",
        imageUrl: "/tukangsedotwc.jpg"
      },
      {
        text: "5. Upgrade Sistem Sanitasi Rumah: Konversi septictank lama ke bio-septic/anaerobic baffled tank, penambahan bak kontrol, sumur resapan/domestik soak pit yang sesuai, grease trap dapur agar lemak tak masuk ke septictank, serta peningkatan ventilasi anti-bau untuk kenyamanan penghuni.",
        imageUrl: "/tukangsedotwc.jpg"
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Kebun",
    src: "/tukangkebun.jpg",
    sections: [
      {
        text: "1. Perawatan Rutin Taman: Pemeliharaan harian/mingguan: menyapu daun, memangkas ringan, menyiram sesuai jadwal, menyiangi gulma, menggemburkan media, serta pemupukan dasar.",
        imageUrl: "/tukangkebun.jpg"
      },
      {
        text: "2. Desain & Pembuatan Taman Baru: Survei lahan dan pencatatan kebutuhan (tema, fungsi, anggaran), lalu penyusunan layout softscape–hardscape. Pekerjaan meliputi pembenahan tanah, penambahan humus/kompos, penanaman tanaman hias/peneduh/penutup tanah, pemasangan batu pijak, border, sampai pot-planter dan pencahayaan taman.",
        imageUrl: "/tukangkebun.jpg"
      },
      {
        text: "3. Pemangkasan & Peremajaan: Pemangkasan estetika dan kesehatan untuk perdu, semak, dan pohon kecil; deadheading (buang bunga/daun mati), serta penjarangan tajuk agar cahaya dan sirkulasi udara optimal.",
        imageUrl: "/tukangkebun.jpg"
      },
      {
        text: "4. Perawatan Rumput & Sistem Irigasi: Perataan dan pemotongan rumput (mowing), aerasi, top dressing, penambalan botak (overseeding/sod), serta penanganan jamur/serangga perusak rumput.",
        imageUrl: "/tukangkebun.jpg"
      },
      {
        text: "5. Pengendalian Hama & Penyakit Tanaman: Identifikasi dini gejala (bercak, layu, kutu daun, ulat), penanganan mekanis/biologis terlebih dahulu, lalu pestisida selektif bila diperlukan dengan dosis aman. Disertai strategi pencegahan: rotasi tanaman, sanitasi area, dan peningkatan kesehatan tanah.",
        imageUrl: "/tukangkebun.jpg"
      },
    ],
  },
  {
    category: "Jasa",
    title: "Tukang Mebel/Furnitur",
    src: "/tukangmebel_furnitur.jpg",
    sections: [
      {
        text: "1. Pembuatan Furnitur Custom: Tukang mebel membuat berbagai perabot sesuai ukuran, gaya, dan bahan yang diinginkan pemilik rumah. Contohnya lemari pakaian built-in, meja dapur, rak TV, tempat tidur, meja kerja, atau kabinet kamar mandi.",
        imageUrl: "/tukangmebel_furnitur.jpg"
      },
      {
        text: "2. Perbaikan dan Restorasi Furnitur Lama: Jasa ini menangani perabot yang rusak, aus, atau kusam agar kembali berfungsi dan tampak baru.",
        imageUrl: "/tukangmebel_furnitur.jpg"
      },
      {
        text: "3. Bongkar Pasang Furnitur Modular: Cocok bagi penghuni rumah yang akan pindah tempat. Tukang mebel membantu membongkar dan memasang kembali furnitur modular seperti lemari knock-down, kitchen set, atau rak rakitan tanpa merusak sambungan. Jasa ini juga bisa disertai penyesuaian ulang ukuran di lokasi baru.",
        imageUrl: "/tukangmebel_furnitur.jpg"
      },
      {
        text: "4. Desain & Produksi Furnitur Dekoratif/Interior: Selain perabot utama, tukang mebel bisa membuat elemen estetika interior seperti panel dinding, backdrop TV, partisi ruangan, meja sudut, rak display, atau headboard custom. Pengerjaan menyesuaikan konsep interior rumah (minimalis, skandinavia, klasik, industrial, dll.",
        imageUrl: "/tukangmebel_furnitur.jpg"
      },
      {
        text: "5. Finishing, Pelapisan, dan Pemeliharaan: Layanan ini mencakup pengecatan, pelapisan melamin atau duco, pelitur ulang furnitur kayu, serta pelapisan ulang sofa dengan kain atau kulit sintetis. Beberapa tukang juga menyediakan jasa poles dan perawatan periodik agar warna dan permukaan furnitur tetap awet.",
        imageUrl: "/tukangmebel_furnitur.jpg"
      },
    ],
  },
];
