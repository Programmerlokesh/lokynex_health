using LokynexHealth.Application.DoctorClinic.Commands.BookAppointment;
using LokynexHealth.Application.DoctorClinic.Commands.CreateSchedule;
using LokynexHealth.Application.DoctorClinic.Commands.ToggleScheduleStatus;
using LokynexHealth.Application.DoctorClinic.Queries.GetAvailableSlots;
using LokynexHealth.Application.DoctorClinic.Queries.GetSchedules;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorClinicController : ControllerBase
{
    private readonly IMediator _mediator;

    public DoctorClinicController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("schedules")]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(CreateSchedule), new { id }, new { id });
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetSchedules([FromQuery] GetSchedulesQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPatch("schedules/{id}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleScheduleStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] GetAvailableSlotsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPost("bookings")]
    public async Task<IActionResult> Book([FromBody] BookAppointmentCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Book), new { id }, new { id });
    }
}