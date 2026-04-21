FROM rust:latest

# Install mingw-w64 for Windows cross-compilation
RUN apt-get update && \
    apt-get install -y gcc-mingw-w64-x86-64 && \
    rm -rf /var/lib/apt/lists/*

# Add Windows GNU target
RUN rustup target add x86_64-pc-windows-gnu

WORKDIR /app

# Copy cargo config for cross-compilation linker
COPY .cargo .cargo

# Copy manifests first for layer caching
COPY Cargo.toml Cargo.lock* ./

# Create dummy sources so cargo can fetch + cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > src/tray.rs && \
    cargo build --release --target x86_64-pc-windows-gnu 2>/dev/null || true && \
    rm -rf src

# Copy assets and real source, force cargo to recompile our crate
COPY assets assets
COPY src src
RUN touch src/*.rs

# Build both binaries
RUN cargo build --release --target x86_64-pc-windows-gnu

# Copy to /out so a volume mount can pick them up
RUN mkdir -p /out && \
    cp /app/target/x86_64-pc-windows-gnu/release/eleks-monitor.exe /out/ && \
    cp /app/target/x86_64-pc-windows-gnu/release/eleks-tray.exe /out/
