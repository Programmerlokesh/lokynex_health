using System.Net;
using System.Text.Json;
using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LokynexHealth.Api.Middleware;

public class ExceptionHandlingMiddleware
{
        private static readonly string[] GenericError = { "Please contact support if the problem persists." };

        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
                _next = next;
                _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
                try
                {
                        await _next(context);
                }
                catch (Exception ex)
                {
                        _logger.LogError(ex, "Unhandled exception occurred");
                        await HandleExceptionAsync(context, ex);
                }
        }

        private static (HttpStatusCode Status, string Title, string[] Errors) Map(Exception exception) =>
            exception switch
            {
                    ValidationException v => (
                    HttpStatusCode.BadRequest,
                    "Validation failed",
                    v.Errors.Select(e => e.ErrorMessage).ToArray()),
                    ConflictException c => (HttpStatusCode.Conflict, "Conflict", new[] { c.Message }),
                    NotFoundException n => (HttpStatusCode.NotFound, "Not found", new[] { n.Message }),
                    UnauthorizedException u => (HttpStatusCode.Unauthorized, "Unauthorized", new[] { u.Message }),
                    DbUpdateException { InnerException: PostgresException pg } => MapPostgres(pg),
                    PostgresException pg => MapPostgres(pg),
                    _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred", GenericError)
            };

        private static (HttpStatusCode Status, string Title, string[] Errors) MapPostgres(PostgresException pg) =>
            pg.SqlState switch
            {
                    PostgresErrorCodes.UniqueViolation => (
                    HttpStatusCode.Conflict,
                    "Conflict",
                    new[] { "A record with the same unique value already exists." }),
                    PostgresErrorCodes.StringDataRightTruncation => (
                    HttpStatusCode.BadRequest,
                    "Validation failed",
                    new[] { "One of the values is too long." }),
                    PostgresErrorCodes.NotNullViolation => (
                    HttpStatusCode.BadRequest,
                    "Validation failed",
                    new[] { $"Required value missing: {pg.ColumnName}" }),
                    // A deployed build that is ahead of the database (migration not run yet).
                    PostgresErrorCodes.UndefinedTable or PostgresErrorCodes.UndefinedColumn => (
                    HttpStatusCode.InternalServerError,
                    "Database is out of date",
                    new[] { "The database is missing a table or column this feature needs. Run the pending SQL migrations from the database/ folder, then try again." }),
                    _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred", GenericError)
            };

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
                if (context.Response.HasStarted) return;

                var (statusCode, title, errors) = Map(exception);

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int)statusCode;

                var response = new
                {
                        status = (int)statusCode,
                        title,
                        errors
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
}