#!/usr/bin/env bash
# Generates the report, the SRS (functional) and the NFR section, then checks the pagination rules.
# Usage: ./make_all.sh <work-dir>
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="$SRC/.."
WORK="${1:?work dir}"
mkdir -p "$WORK"
build() {  # mode, output file
  local mode="$1" target="$2" dir="$WORK/$1"
  mkdir -p "$dir"
  ( cd "$dir"
    MODE="$mode" python3 "$SRC/build.py" "$dir/pass1.docx" >/dev/null
    soffice --headless --convert-to pdf --outdir "$dir" "$dir/pass1.docx" >/dev/null 2>&1
    python3 "$SRC/pages.py" pass1.pdf pass1.docx.headings.json >/dev/null
    MODE="$mode" python3 "$SRC/build.py" "$dir/final.docx" pages.json
    soffice --headless --convert-to pdf --outdir "$dir" "$dir/final.docx" >/dev/null 2>&1
    echo "== $mode: $(pdfinfo final.pdf | grep Pages)"
    python3 "$SRC/check_layout.py" final.pdf final.docx
    cp final.docx "$OUT/$target" )
}
build report PBL_Report_Obrijan_Filip_FAF232.docx
build srs SRS_AgroHub_Obrijan_Filip_FAF232.docx
build nfr SRS_AgroHub_NonFunctional_Requirements_Obrijan_Filip_FAF232.docx
build review SRS_Validation_Report_ESL_Mitu_Vladlen_by_Obrijan_Filip.docx
