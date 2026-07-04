"""
Extract hyperlinks from Manulife Directory PDF and create XLSX with:
- Column A: Nama File (display text of the hyperlink)
- Column B: Link (URL)

This script parses the PDF structure directly without external PDF libraries,
using the PDF's structure tree to find link annotations and their associated text.
"""

import re
import zlib
import zipfile
from xml.sax.saxutils import escape
import os


def parse_pdf(pdf_path):
    """Parse PDF and extract all hyperlinks with their display text."""

    with open(pdf_path, 'rb') as f:
        data = f.read()

    # Parse all PDF objects
    objects = {}
    obj_pattern = re.compile(rb'(\d+)\s+0\s+obj\s*\n?(.*?)\nendobj', re.DOTALL)
    for m in obj_pattern.finditer(data):
        obj_num = int(m.group(1))
        obj_content = m.group(2)
        objects[obj_num] = obj_content

    def get_stream(obj_content):
        stream_match = re.search(
            rb'stream\r?\n(.*?)\r?\nendstream', obj_content, re.DOTALL
        )
        if stream_match:
            raw = stream_match.group(1)
            try:
                return zlib.decompress(raw)
            except Exception:
                return raw
        return None

    def parse_tounicode(cmap_data):
        """Parse a ToUnicode CMap to build glyph ID -> unicode character mapping."""
        mapping = {}
        text = cmap_data.decode('latin-1', errors='replace')

        bfchar_blocks = re.findall(r'beginbfchar(.*?)endbfchar', text, re.DOTALL)
        for block in bfchar_blocks:
            entries = re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block)
            for src, dst in entries:
                src_int = int(src, 16)
                dst_chars = bytes.fromhex(dst).decode('utf-16-be', errors='replace')
                mapping[src_int] = dst_chars

        bfrange_blocks = re.findall(
            r'beginbfrange(.*?)endbfrange', text, re.DOTALL
        )
        for block in bfrange_blocks:
            entries = re.findall(
                r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block
            )
            for src_lo, src_hi, dst_start in entries:
                lo = int(src_lo, 16)
                hi = int(src_hi, 16)
                dst = int(dst_start, 16)
                for i in range(hi - lo + 1):
                    mapping[lo + i] = chr(dst + i)

        return mapping

    # Find all page objects
    page_objs = []
    for obj_num, content in objects.items():
        content_str = content.decode('latin-1', errors='replace')
        if '/Type/Page' in content_str and '/Type/Pages' not in content_str:
            page_objs.append(obj_num)

    # Build font ToUnicode mappings for each page
    page_fonts = {}
    for page_obj in page_objs:
        content_str = objects[page_obj].decode('latin-1', errors='replace')
        font_refs = re.findall(r'/(F\d+)\s+(\d+)\s+0\s+R', content_str)
        fonts = {}
        for fname, fobj_str in font_refs:
            fobj = int(fobj_str)
            if fobj in objects:
                font_content = objects[fobj].decode('latin-1', errors='replace')
                tu_match = re.search(
                    r'/ToUnicode\s+(\d+)\s+0\s+R', font_content
                )
                if tu_match:
                    tu_obj = int(tu_match.group(1))
                    if tu_obj in objects:
                        stream = get_stream(objects[tu_obj])
                        if stream:
                            fonts[fname] = parse_tounicode(stream)
        page_fonts[page_obj] = fonts

    # Get content streams for each page
    page_streams = {}
    for page_obj in page_objs:
        content_str = objects[page_obj].decode('latin-1', errors='replace')
        contents_match = re.search(r'/Contents\[\s*([\d\s0R]+)\]', content_str)
        if contents_match:
            refs = re.findall(r'(\d+)\s+0\s+R', contents_match.group(1))
            full_stream = b''
            for ref in refs:
                ref_int = int(ref)
                if ref_int in objects:
                    stream = get_stream(objects[ref_int])
                    if stream:
                        full_stream += stream
            page_streams[page_obj] = full_stream
        else:
            contents_match = re.search(
                r'/Contents\s+(\d+)\s+0\s+R', content_str
            )
            if contents_match:
                ref_int = int(contents_match.group(1))
                if ref_int in objects:
                    stream = get_stream(objects[ref_int])
                    if stream:
                        page_streams[page_obj] = stream

    def find_mcid_block(stream, mcid):
        """Find MCID block handling nested BDC/EMC properly."""
        pattern = re.compile(
            rb'/\w+\s*<<\s*/MCID\s+'
            + str(mcid).encode()
            + rb'\s*>>\s*BDC'
        )
        match = pattern.search(stream)
        if not match:
            return None

        start = match.end()

        # Find matching EMC handling nesting
        depth = 1
        pos = start
        while depth > 0 and pos < len(stream):
            next_bdc = stream.find(b'BDC', pos)
            next_emc = stream.find(b'EMC', pos)

            if next_emc == -1:
                break

            if next_bdc != -1 and next_bdc < next_emc:
                # Verify it's a real BDC (preceded by whitespace or >>)
                if next_bdc > 0 and stream[next_bdc - 1:next_bdc] in (
                    b' ', b'\n', b'\r', b'>'
                ):
                    depth += 1
                pos = next_bdc + 3
            else:
                depth -= 1
                if depth == 0:
                    return stream[start:next_emc]
                pos = next_emc + 3

        return stream[start:]

    def decode_text_from_mcid(stream, mcid, fonts):
        """Extract and decode text from a marked content block with given MCID."""
        block = find_mcid_block(stream, mcid)
        if not block:
            return None

        current_font = None
        text_parts = []

        lines = block.split(b'\n')
        for line in lines:
            line = line.strip()

            # Font change: /F5 14.666667 Tf
            font_match = re.match(rb'/(F\d+)\s+[\d.]+\s+Tf', line)
            if font_match:
                current_font = font_match.group(1).decode()

            # Hex string Tj: <XXXX> Tj
            hex_tj_matches = re.findall(rb'<([0-9A-Fa-f]+)>\s*Tj', line)
            for h in hex_tj_matches:
                h_str = h.decode()
                mapping = fonts.get(current_font, {})
                for i in range(0, len(h_str), 4):
                    if i + 4 <= len(h_str):
                        gid = int(h_str[i:i+4], 16)
                        char = mapping.get(gid, '')
                        text_parts.append(char)

            # TJ array: [...] TJ
            tj_array_match = re.search(rb'\[(.*?)\]\s*TJ', line, re.DOTALL)
            if tj_array_match:
                arr = tj_array_match.group(1)
                hex_items = re.findall(rb'<([0-9A-Fa-f]+)>', arr)
                mapping = fonts.get(current_font, {})
                for h in hex_items:
                    h_str = h.decode()
                    for i in range(0, len(h_str), 4):
                        if i + 4 <= len(h_str):
                            gid = int(h_str[i:i+4], 16)
                            char = mapping.get(gid, '')
                            text_parts.append(char)

        return ''.join(text_parts) if text_parts else None

    # Collect all Link StructElem objects with their URIs and text
    link_results = []

    for obj_num, content in objects.items():
        content_str = content.decode('latin-1', errors='replace')
        if '/S/Link' not in content_str or '/Type/StructElem' not in content_str:
            continue

        # Get /K children
        k_match = re.search(r'/K\[\s*(.*?)\]', content_str, re.DOTALL)
        if not k_match:
            k_match = re.search(r'/K\s+(\d+\s+0\s+R)', content_str)
        if not k_match:
            continue

        k_content = k_match.group(1)

        # Find child object references
        child_refs = re.findall(r'(\d+)\s+0\s+R', k_content)

        # Find OBJR entries to get the annotation object (contains URI)
        objr_matches = re.findall(
            r'<<[^>]*?/Obj\s+(\d+)\s+0\s+R[^>]*?>>', k_content
        )

        uri = None
        for objr_ref in objr_matches:
            annot_obj = int(objr_ref)
            if annot_obj in objects:
                annot_str = objects[annot_obj].decode('latin-1', errors='replace')
                uri_match = re.search(r'/URI\((.*?)\)', annot_str)
                if uri_match:
                    uri = uri_match.group(1)
                    break

        if not uri:
            continue

        # Get text from Span children
        text_parts = []
        for child_ref in child_refs:
            child_obj = int(child_ref)
            if child_obj in objects:
                child_str = objects[child_obj].decode('latin-1', errors='replace')
                if '/S/Span' in child_str and '/Type/StructElem' in child_str:
                    # Get MCID and page
                    mcid_match = re.search(r'/K\s+(\d+)', child_str)
                    pg_match = re.search(r'/Pg\s+(\d+)\s+0\s+R', child_str)
                    if mcid_match and pg_match:
                        mcid = int(mcid_match.group(1))
                        pg = int(pg_match.group(1))
                        if pg in page_streams and pg in page_fonts:
                            text = decode_text_from_mcid(
                                page_streams[pg], mcid, page_fonts[pg]
                            )
                            if text:
                                text_parts.append(text)

        link_text = ''.join(text_parts).strip()
        if uri:
            link_results.append((obj_num, link_text, uri))

    # Sort by object number to maintain document order
    link_results.sort(key=lambda x: x[0])

    return [(text, uri) for _, text, uri in link_results]


def create_xlsx(links, output_path):
    """Create an XLSX file with Nama File and Link columns."""

    # XLSX is a ZIP file containing XML files
    # Build shared strings (all unique strings)
    shared_strings = []
    string_index = {}

    def get_string_index(s):
        if s not in string_index:
            string_index[s] = len(shared_strings)
            shared_strings.append(s)
        return string_index[s]

    # Header strings
    get_string_index("Nama File")
    get_string_index("Link")

    # Data strings
    for nama, link in links:
        get_string_index(nama)
        get_string_index(link)

    # Build sheet XML
    rows_xml = []
    # Header row
    rows_xml.append(
        '<row r="1">'
        f'<c r="A1" t="s"><v>{get_string_index("Nama File")}</v></c>'
        f'<c r="B1" t="s"><v>{get_string_index("Link")}</v></c>'
        '</row>'
    )

    # Data rows
    for i, (nama, link) in enumerate(links, start=2):
        nama_idx = get_string_index(nama)
        link_idx = get_string_index(link)
        rows_xml.append(
            f'<row r="{i}">'
            f'<c r="A{i}" t="s"><v>{nama_idx}</v></c>'
            f'<c r="B{i}" t="s"><v>{link_idx}</v></c>'
            '</row>'
        )

    sheet_data = '\n'.join(rows_xml)

    # Shared strings XML
    ss_items = []
    for s in shared_strings:
        escaped = escape(s)
        ss_items.append(f'<si><t>{escaped}</t></si>')
    ss_data = '\n'.join(ss_items)

    # Create the XLSX ZIP
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Links" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>'''

    workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    sheet1 = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    {sheet_data}
  </sheetData>
</worksheet>'''

    shared_strings_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(shared_strings)}" uniqueCount="{len(shared_strings)}">
  {ss_data}
</sst>'''

    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="1">
    <fill><patternFill patternType="none"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>'''

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', content_types)
        zf.writestr('_rels/.rels', rels)
        zf.writestr('xl/workbook.xml', workbook)
        zf.writestr('xl/_rels/workbook.xml.rels', workbook_rels)
        zf.writestr('xl/worksheets/sheet1.xml', sheet1)
        zf.writestr('xl/sharedStrings.xml', shared_strings_xml)
        zf.writestr('xl/styles.xml', styles)


def main():
    pdf_path = 'Source/Agency/Manulife File Penting - Directory Per Juli 2026.pdf'
    xlsx_path = 'Source/Agency/Manulife File Penting - Directory Per Juli 2026 - Links.xlsx'

    print(f"Extracting hyperlinks from: {pdf_path}")
    links = parse_pdf(pdf_path)
    print(f"Found {len(links)} hyperlinks")

    # Show first few
    for i, (text, url) in enumerate(links[:10]):
        print(f"  {i+1}. '{text}' -> {url[:70]}...")

    print(f"\nCreating XLSX: {xlsx_path}")
    create_xlsx(links, xlsx_path)
    print("Done!")


if __name__ == '__main__':
    main()
