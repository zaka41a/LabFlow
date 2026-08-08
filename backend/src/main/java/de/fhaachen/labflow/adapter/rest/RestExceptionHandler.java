package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.AccessViolationException;
import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.application.ResourceNotFoundException;
import de.fhaachen.labflow.domain.DomainException;
import de.fhaachen.labflow.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class RestExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(RestExceptionHandler.class);

    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    ProblemDetail handleNotFound(Exception exception, HttpServletRequest request) {
        return problem(
                HttpStatus.NOT_FOUND,
                "RESOURCE_NOT_FOUND",
                "Ressource nicht gefunden",
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(AccessViolationException.class)
    ProblemDetail handleForbidden(AccessViolationException exception, HttpServletRequest request) {
        return problem(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "Zugriff verweigert",
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler({DomainException.class, ConcurrencyConflictException.class})
    ProblemDetail handleConflict(RuntimeException exception, HttpServletRequest request) {
        String code = exception instanceof ConcurrencyConflictException
                ? "CONCURRENT_MODIFICATION"
                : "INVALID_STATE_TRANSITION";
        return problem(
                HttpStatus.CONFLICT,
                code,
                "Vorgang nicht möglich",
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentNotValidException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class
    })
    ProblemDetail handleBadRequest(Exception exception, HttpServletRequest request) {
        return problem(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST",
                "Ungültige Anfrage",
                "Die Anfrage enthält ungültige oder fehlende Angaben.",
                request
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ProblemDetail handlePayloadTooLarge(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request
    ) {
        return problem(
                HttpStatus.CONTENT_TOO_LARGE,
                "PAYLOAD_TOO_LARGE",
                "Datei zu groß",
                "Das Gerätebild darf höchstens 4 MB groß sein.",
                request
        );
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception exception, HttpServletRequest request) {
        LOGGER.error("Unhandled API error", exception);
        return problem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "Interner Fehler",
                "Die Anfrage konnte nicht verarbeitet werden.",
                request
        );
    }

    private static ProblemDetail problem(
            HttpStatus status,
            String code,
            String title,
            String detail,
            HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setProperty("code", code);
        problem.setProperty("correlationId", CorrelationIdFilter.from(request));
        return problem;
    }
}
