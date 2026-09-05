using System.Net;
using System.Text.Json;
using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;

namespace LokynexHealth.Api.Middleware;

public class ExceptionHandlingMiddleware
{
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

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                validationEx.Errors.Select(e => e.ErrorMessage).ToArray()
            ),
            ConflictException conflictEx => (
                HttpStatusCode.Conflict,
                "Conflict",
                new[] { conflictEx.Message }
            ),
            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                "Not found",
                new[] { notFoundEx.Message }
            ),
            UnauthorizedException unauthorizedEx => (
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                new[] { unauthorizedEx.Message }
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                new[] { "Please contact support if the problem persists." }
            )
        };

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