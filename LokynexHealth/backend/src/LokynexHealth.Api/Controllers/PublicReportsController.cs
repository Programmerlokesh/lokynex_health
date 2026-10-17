using LokynexHealth.Application.PublicReports;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

/// Opened by the QR code printed on a report. NO login: the 128-bit secret
/// token in the link is the key.
[ApiController]
[Route("api/public/reports")]
[AllowAnonymous]
public class PublicReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PublicReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> Get(string token, CancellationToken ct)
    {
        Response.Headers["Cache-Control"] = "no-store";
        Response.Headers["X-Robots-Tag"] = "noindex, nofollow";

        var result = await _mediator.Send(new GetPublicReportQuery { Token = token }, ct);
        return Ok(result);
    }
}