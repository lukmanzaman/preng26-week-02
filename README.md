# The Pig That Wants to Be Eaten (100 Eksperimen Pikiran Julian Baggini)

Repositori ini memuat korpus lengkap **100 Eksperimen Pikiran Filosofis** dari buku karya Julian Baggini (*The Pig That Wants to Be Eaten: And Ninety-Nine Other Thought Experiments*), lengkap dengan terjemahan bahasa Indonesia berkualitas sastra tinggi (*high literacy*) dan aplikasi web eksplorasi interaktif.

---

## 🌟 Fitur Utama Aplikasi Web

Aplikasi web interaktif dirancang dengan estetika editorial *avant-garde* tanpa *AI slop*:
- **Tipografi Khusus**: Menggunakan *Fraunces* (display editorial), *Petrona* (prosa sastra), *Space Mono* (aksen teknis), dan *Plus Jakarta Sans*.
- **4 Mode Eksplorasi**:
  1. **Katalog (Explorer)**: Pencarian instan (*live search*), filter 7 domain filosofis (Epistemologi, Etika & Moralitas, Kesadaran & AI, Identitas Diri, Keadilan Politik, Estetika & Bahasa, Logika & Paradoks), dan kartu artikel.
  2. **Ruang Baca Editorial (Reader)**: Tampilan buku interaktif dengan *drop-cap*, navigasi bab, penyesuai ukuran teks, dan modul **Dilema & Perenungan** (*interactive reflection poll*).
  3. **Konstelasi Gagasan (Graph Network)**: Jejaring kanvas fisika interaktif yang memetakan hubungan rujukan silang antareksperimen.
  4. **Tabrakan Gagasan (Thought Collider)**: Generator komparatif yang menyandingkan dua eksperimen pikiran secara acak untuk memantik sintesis nalar baru.
- **4 Palet Tema**: *Naskah Klasik* (Warm Parchment), *Kamar Gelap* (Obsidian), *Kertas Sepia*, dan *Koran Monokrom*.

---

## 📁 Struktur Repositori

```text
├── index.html            # Aplikasi web interaktif utama
├── style.css             # Lembar gaya tata letak editorial
├── app.js                # Logika router, kanvas konstelasi, dan polling
├── data.js               # Basis data terstruktur 100 eksperimen pikiran (ID)
├── md_id/                # Korpus 100 berkas terjemahan Bahasa Indonesia
│   ├── INDEX.md          # Daftar isi lengkap & kata pengantar terjemahan
│   ├── STYLE_GUIDE.md    # Panduan baku mutu prosa sastra (high literacy)
│   ├── manifest.json     # Kontrak istilah glosarium & pemetaan judul
│   ├── progress.json     # Pelacakan status pengerjaan (state machine)
│   └── 001_iblis_jahat.md ... 100_kafe_sarang.md
├── md/                   # Korpus 100 berkas Markdown naskah asli Bahasa Inggris
├── Baginni_pig.txt       # Teks penuh hasil konversi PDF
└── Baginni pig.pdf       # Dokumen sumber asli
```

---

## 🚀 Cara Menjalankan

Cukup buka berkas `index.html` langsung di peramban web mana pun (Chrome, Edge, Firefox, Safari). Aplikasi berjalan 100% *client-side* tanpa membutuhkan dependensi atau server eksternal.
