package de.fhaachen.labflow.application;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EquipmentImageTest {

    @ParameterizedTest
    @MethodSource("supportedImages")
    void derivesTheTrustedContentTypeFromTheFileSignature(byte[] content, String contentType) {
        EquipmentImage image = new EquipmentImage(content, "application/octet-stream");

        assertThat(image.contentType()).isEqualTo(contentType);
        assertThat(image.content()).containsExactly(content);
    }

    @Test
    void rejectsUnsupportedFileContent() {
        assertThatThrownBy(() -> new EquipmentImage(
                "not-an-image".getBytes(),
                "image/png"
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PNG, JPEG or WebP");
    }

    @Test
    void returnsDefensiveCopiesOfTheImageData() {
        byte[] source = png();
        EquipmentImage image = new EquipmentImage(source, "image/png");

        source[0] = 0;
        byte[] returned = image.content();
        returned[1] = 0;

        assertThat(image.content()).containsExactly(png());
    }

    private static Stream<Arguments> supportedImages() {
        return Stream.of(
                Arguments.of(png(), "image/png"),
                Arguments.of(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}, "image/jpeg"),
                Arguments.of(
                        new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'},
                        "image/webp"
                )
        );
    }

    static byte[] png() {
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        };
    }
}
