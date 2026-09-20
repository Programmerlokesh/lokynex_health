using System.Text;
using FluentValidation;
using LokynexHealth.Application.Common.Behaviors;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Users.Commands.CreateUser;
using LokynexHealth.Infrastructure.Persistence;
using LokynexHealth.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// Railway (and most container hosts) assign the port dynamically via the
// PORT env var. Locally (dotnet run / launchSettings) this is unset, so
// Kestrel falls back to its normal default binding — no change in dev.
// ============================================================
var railwayPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(railwayPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{railwayPort}");
}

// ============================================================
// Database + Postgres enum mapping
// ============================================================
var connectionString = builder.Configuration.GetConnectionString("TenantDb");

var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);

// ---------- Tenant-schema enums (lab_demo.*) ----------
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.RecordStatus>(
    "lab_demo.record_status", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.CommissionType>(
    "lab_demo.commission_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.GenderType>(
    "lab_demo.gender_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.DiscountType>(
    "lab_demo.discount_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.PaymentMethodType>(
    "lab_demo.payment_method_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.PaymentStatusType>(
    "lab_demo.payment_status_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.ReportStatusType>(
    "lab_demo.report_status_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.CommissionEntityType>(
    "lab_demo.commission_entity_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.CommissionStatusType>(
    "lab_demo.commission_status_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.ReportSourceType>(
    "lab_demo.report_source_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.BookingStatusType>(
    "lab_demo.booking_status_type", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());

// ---------- Platform-schema enums (platform.*) — Doctor/Referral/Tenant/Plan/Subscription live here ----------
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.PlatformRecordStatus>(
    "platform.record_status", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.BillingCycleType>(
    "platform.billing_cycle", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());
dataSourceBuilder.MapEnum<LokynexHealth.Domain.Enums.SubscriptionStatusType>(
    "platform.subscription_status", nameTranslator: new Npgsql.NameTranslation.NpgsqlNullNameTranslator());

var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<LokynexHealthDbContext>(options =>
    options.UseNpgsql(dataSource)
           .UseSnakeCaseNamingConvention());

// ============================================================
// Application services (Dependency Inversion — Application layer only knows interfaces)
// ============================================================
builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<LokynexHealthDbContext>());

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
builder.Services.AddHttpContextAccessor(); // required by CurrentUserService

// ============================================================
// CORS — allow the Next.js frontend to call this API
// ============================================================
// "AllowedOrigins" can be set as an env var (comma-separated) on Railway,
// e.g. AllowedOrigins=https://your-frontend.vercel.app,https://your-codespace-3000.app.github.dev
// Falls back to localhost:3000 for local dev when not set.
var allowedOrigins = builder.Configuration["AllowedOrigins"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ============================================================
// Authentication (JWT) + Authorization
// ============================================================
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ============================================================
// MediatR + FluentValidation
// ============================================================
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(CreateUserCommand).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(typeof(CreateUserCommand).Assembly);

// ============================================================
// Controllers + Swagger (with Bearer auth support)
// ============================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================================
// Build + Middleware pipeline
// ============================================================
var app = builder.Build();

// Exception handling middleware goes FIRST — outermost wrapper, catches
// anything thrown anywhere downstream in the pipeline.
app.UseMiddleware<LokynexHealth.Api.Middleware.ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must run before Authentication/Authorization so preflight requests succeed.
app.UseCors("AllowFrontend");

// Authentication BEFORE Authorization — must know WHO the caller is before
// deciding WHAT they're allowed to do.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();