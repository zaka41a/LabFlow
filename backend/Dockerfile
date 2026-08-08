FROM maven:3.9.11-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml .
COPY src ./src
RUN mvn --batch-mode --no-transfer-progress -Dmaven.test.skip=true package && \
    cp target/labflow-backend-*.jar application.jar

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S labflow && adduser -S -G labflow labflow

WORKDIR /application

COPY --from=build --chown=labflow:labflow /workspace/application.jar application.jar

USER labflow

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
    CMD wget --quiet --output-document=- http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/application/application.jar"]
