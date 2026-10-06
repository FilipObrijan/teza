# Sursele raportului PBL

Raportul `../PBL_Report_Obrijan_Filip_FAF232.docx` este generat din aceste fișiere, pe baza template-ului oficial (`template.docx`).

- `content.py` – textul capitolelor, tabelele, bibliografia
- `fig.py` – desenează Figure 1.1 (`fig1_1.png`)
- `build.py` – asamblează documentul Word
- `pages.py` – calculează numerele de pagină pentru cuprins (necesită LibreOffice)

```bash
pip install python-docx pillow
python3 build.py /tmp/pass1.docx
soffice --headless --convert-to pdf --outdir /tmp /tmp/pass1.docx
python3 pages.py /tmp/pass1.pdf /tmp/pass1.docx.headings.json   # scrie pages.json
python3 build.py ../PBL_Report_Obrijan_Filip_FAF232.docx pages.json
```

Verificarea paginării (niciun tabel sau figură la început/sfârșit de pagină și niciunul rupt pe două pagini):

```bash
soffice --headless --convert-to pdf --outdir /tmp ../PBL_Report_Obrijan_Filip_FAF232.docx
python3 check_layout.py /tmp/PBL_Report_Obrijan_Filip_FAF232.pdf ../PBL_Report_Obrijan_Filip_FAF232.docx
```
