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
        var result = await _mediator.Send(command, ct);
        return Ok(new { id = result.Id, publicToken = result.PublicToken });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings([FromQuery] Guid? departmentId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetLabReportSettingsQuery { DepartmentId = departmentId }, ct);
        return Ok(result);
    }

    // Departments that have their own report pad (the rest use the lab default).
    [HttpGet("settings/departments")]
    public async Task<IActionResult> GetCustomPadDepartments(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCustomPadDepartmentsQuery(), ct);
        return Ok(result);
    }

    // Remove a department's own pad so it falls back to the lab default.
    [HttpDelete("settings/{departmentId:guid}")]
    public async Task<IActionResult> DeleteDepartmentPad(Guid departmentId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteDepartmentPadCommand { DepartmentId = departmentId }, ct);
        return NoContent();
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