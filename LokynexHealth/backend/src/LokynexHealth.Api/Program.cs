using System.Text;
using FluentValidation;
using LokynexHealth.Application.Common.Behaviors;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.Users.Commands.CreateUser;
using LokynexHealth.Infrastructure.Persistence;
using LokynexHealth.Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
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
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:TenantDb is not set. Put it in appsettings.Development.json " +
        "(git-ignored), user-secrets, or the ConnectionStrings__TenantDb environment variable.");
}

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

// EF Core (Npgsql provider 9+) only recognises native PostgreSQL enums that are
// registered HERE, on UseNpgsql(...). The dataSourceBuilder.MapEnum calls above
// teach the low-level driver; HasPostgresEnum() in the DbContext is only for
// migrations. Without these lines EF read every enum column as an int and failed
// with "Reading as 'System.Int32' is not supported for fields having DataTypeName
// 'platform.record_status'". The schema is given explicitly because
// lab_demo.record_status and platform.record_status share the same name.
// IMPORTANT: this translator is created ONCE here, not inside the UseNpgsql
// lambda. AddDbContext re-invokes that lambda on every DbContext instantiation
// (once per request), and a `new NpgsqlNullNameTranslator()` there made every
// request's options "look different" by reference — EF Core couldn't cache its
// internal model/service provider between requests, so it built a fresh
// IServiceProvider on every single request. After ~20 requests EF throws
// ManyServiceProvidersCreatedWarning as a safety valve ("more than twenty
// IServiceProvider instances created"), which is exactly the 500 error seen on
// /api/Users and /api/my/notifications. Reusing ONE static instance keeps the
// options fingerprint stable so EF reuses its cached internals.
var pgEnumNameTranslator = new Npgsql.NameTranslation.NpgsqlNullNameTranslator();

builder.Services.AddDbContext<LokynexHealthDbContext>(options =>
    options.UseNpgsql(dataSource, npgsql =>
    {
        var enumNames = pgEnumNameTranslator;

        npgsql.MapEnum<LokynexHealth.Domain.Enums.RecordStatus>("record_status", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.CommissionType>("commission_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.GenderType>("gender_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.DiscountType>("discount_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.PaymentMethodType>("payment_method_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.PaymentStatusType>("payment_status_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.ReportStatusType>("report_status_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.CommissionEntityType>("commission_entity_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.CommissionStatusType>("commission_status_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.ReportSourceType>("report_source_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.BookingStatusType>("booking_status_type", "lab_demo", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.PlatformRecordStatus>("record_status", "platform", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.BillingCycleType>("billing_cycle", "platform", enumNames);
        npgsql.MapEnum<LokynexHealth.Domain.Enums.SubscriptionStatusType>("subscription_status", "platform", enumNames);
    })
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
// Always allowed: local dev + the production Vercel domain.
// Extra origins can be added with the "AllowedOrigins" env var on Railway
// (comma-separated). Vercel preview deployments of THIS project
// (lokynex-health-<hash>-lokesh-debnaths-projects.vercel.app) are allowed too.
var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:3000",
    "https://lokynex-health-five.vercel.app"
};

var extraOrigins = builder.Configuration["AllowedOrigins"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();
foreach (var extra in extraOrigins)
{
    allowedOrigins.Add(extra.TrimEnd('/'));
}

static bool IsProjectVercelPreview(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
    return uri.Scheme == Uri.UriSchemeHttps
        && uri.Host.StartsWith("lokynex-health-", StringComparison.OrdinalIgnoreCase)
        && uri.Host.EndsWith("-lokesh-debnaths-projects.vercel.app", StringComparison.OrdinalIgnoreCase);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                  allowedOrigins.Contains(origin) || IsProjectVercelPreview(origin))
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ============================================================
// Authentication (JWT) + Authorization
// ============================================================
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32 || jwtSecret.StartsWith("CHANGE_ME"))
{
    // Refuse to start with a missing/placeholder secret — anyone who knows the
    // placeholder could forge a SuperAdmin token.
    throw new InvalidOperationException(
        "Jwt:Secret is missing, too short (min 32 chars) or still the placeholder. " +
        "Set a long random value in appsettings.Development.json / user-secrets / the Jwt__Secret env var.");
}
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

// Default policy = what a bare [Authorize] means on every LAB controller.
// It now rejects SuperAdmin tokens: a SuperAdmin can sign in, but can never
// use a lab's Users/Orders/Branches/... endpoints. The four platform
// controllers (Labs, Plans, Subscriptions, Notifications) use
// [Authorize(Roles = "SuperAdmin")], which does not use this default policy.
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireAssertion(ctx => !ctx.User.HasClaim("token_type", "SuperAdmin"))
        .Build();
});

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