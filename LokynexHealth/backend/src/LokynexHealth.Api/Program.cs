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
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("TenantDb");

var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
// ... (existing MapEnum calls stay exactly as they are — not repeated here for brevity)
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<LokynexHealthDbContext>(options =>
    options.UseNpgsql(dataSource)
           .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<LokynexHealthDbContext>());

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITenantProvisioningService, LokynexHealth.Infrastructure.Persistence.TenantProvisioningService>();
builder.Services.AddHttpContextAccessor();   // required by CurrentUserService

// ---------- JWT Authentication ----------
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
        ClockSkew = TimeSpan.Zero   // no grace period after expiry — strict
    };
});

builder.Services.AddAuthorization();

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(CreateUserCommand).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(typeof(CreateUserCommand).Assembly);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });
});

var app = builder.Build();

app.UseMiddleware<LokynexHealth.Api.Middleware.ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ---------- Order matters: Authentication BEFORE Authorization ----------
// Authentication figures out WHO the caller is (validates the token).
// Authorization decides WHAT that identified caller is allowed to do.
// Reversing this order would mean checking permissions before we even know who's asking.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();