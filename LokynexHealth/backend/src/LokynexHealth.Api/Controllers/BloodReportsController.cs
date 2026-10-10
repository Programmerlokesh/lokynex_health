using LokynexHealth.Application.BloodReports;
using LokynexHealth.Application.BloodReports.Commands.LogDelivery;
using LokynexHealth.Application.BloodReports.Commands.SaveBloodReport;
using LokynexHealth.Application.BloodReports.Queries.GetBloodReportForm;
using LokynexHealth.Application.BloodReports.Settings;
using LokynexHealth.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BloodReportsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public BloodReportsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // Blank format (or saved values) for one patient + test line.
    [HttpGet("form/{orderItemId:guid}")]
    public async Task<IActionResult> GetForm(Guid orderItemId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetBloodReportFormQuery { OrderItemId = orderItemId }, ct);
        return Ok(result);
    }

    // Create or update the structured report.
    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] SaveBloodReportCommand command, CancellationToken ct)
    {
        command.CreatedBy = _currentUser.UserId;
        var id = await _mediator.Send(command, ct);
        return Ok(new { id });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetLabReportSettingsQuery(), ct);
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> SaveSettings([FromBody] SaveLabReportSettingsCommand command, CancellationToken ct)
    {
        command.UpdatedBy = _currentUser.UserId;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    // Log Print / PDF download / WhatsApp
    [HttpPost("{documentId:guid}/delivery")]
    public async Task<IActionResult> LogDelivery(Guid documentId, [FromBody] LogReportDeliveryCommand command, CancellationToken ct)
    {
        command.DocumentId = documentId;
        command.DeliveredBy = _currentUser.UserId;
        await _mediator.Send(command, ct);
        return NoContent();
    }
}