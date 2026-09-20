# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only project files first so Docker can cache the restore layer
COPY LokynexHealth.slnx .
COPY src/LokynexHealth.Api/LokynexHealth.Api.csproj src/LokynexHealth.Api/
COPY src/LokynexHealth.Application/LokynexHealth.Application.csproj src/LokynexHealth.Application/
COPY src/LokynexHealth.Domain/LokynexHealth.Domain.csproj src/LokynexHealth.Domain/
COPY src/LokynexHealth.Infrastructure/LokynexHealth.Infrastructure.csproj src/LokynexHealth.Infrastructure/

RUN dotnet restore src/LokynexHealth.Api/LokynexHealth.Api.csproj

# Now copy the rest of the source and publish
COPY src/ src/
RUN dotnet publish src/LokynexHealth.Api/LokynexHealth.Api.csproj -c Release -o /app --no-restore

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Railway injects PORT at runtime; Program.cs reads it and binds Kestrel to it.
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "LokynexHealth.Api.dll"]