package lk.AccessOne.shared.web;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.stream.Collectors;

/** One CSV writer shared by every report export -- every report wants the same two guarantees. */
public final class ReportCsv {

    private ReportCsv() { }

    public static ResponseEntity<byte[]> of(String filename, List<String> headers, List<List<String>> rows) {
        StringBuilder out = new StringBuilder();
        out.append(String.join(",", headers)).append("\r\n");
        rows.forEach(row -> out.append(row.stream()
                .map(ReportCsv::escape).collect(Collectors.joining(","))).append("\r\n"));

        // UTF-8 BOM: without it, Excel opens the file as ANSI and Sinhala
        // and Tamil names appear as mojibake. One three-byte prefix fixes it.
        byte[] bom = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] body = out.toString().getBytes(StandardCharsets.UTF_8);
        byte[] bytes = ByteBuffer.allocate(bom.length + body.length).put(bom).put(body).array();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"%s.csv\"".formatted(filename))
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    private static String escape(String value) {
        if (value == null) return "";
        // Guard against CSV formula injection -- a cell starting with = + - or @
        // is executed as a formula the moment the file opens in Excel.
        String safe = value.startsWith("=") || value.startsWith("+")
                   || value.startsWith("-") || value.startsWith("@")
                    ? "'" + value : value;
        return safe.contains(",") || safe.contains("\"") || safe.contains("\n")
                ? "\"" + safe.replace("\"", "\"\"") + "\""
                : safe;
    }
}
