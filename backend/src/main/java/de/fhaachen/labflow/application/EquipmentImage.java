package de.fhaachen.labflow.application;

import java.util.Arrays;

public record EquipmentImage(byte[] content, String contentType) {

    public static final int MAXIMUM_BYTES = 4 * 1024 * 1024;

    public EquipmentImage {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Equipment image must not be empty");
        }
        if (content.length > MAXIMUM_BYTES) {
            throw new IllegalArgumentException("Equipment image exceeds 4 MiB");
        }
        content = Arrays.copyOf(content, content.length);
        contentType = detectContentType(content);
    }

    @Override
    public byte[] content() {
        return Arrays.copyOf(content, content.length);
    }

    private static String detectContentType(byte[] content) {
        if (hasPrefix(content, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (hasPrefix(content, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (content.length >= 12
                && hasAscii(content, 0, "RIFF")
                && hasAscii(content, 8, "WEBP")) {
            return "image/webp";
        }
        throw new IllegalArgumentException("Equipment image must be PNG, JPEG or WebP");
    }

    private static boolean hasPrefix(byte[] content, int... expected) {
        if (content.length < expected.length) {
            return false;
        }
        for (int index = 0; index < expected.length; index++) {
            if (Byte.toUnsignedInt(content[index]) != expected[index]) {
                return false;
            }
        }
        return true;
    }

    private static boolean hasAscii(byte[] content, int offset, String expected) {
        for (int index = 0; index < expected.length(); index++) {
            if (content[offset + index] != (byte) expected.charAt(index)) {
                return false;
            }
        }
        return true;
    }
}
