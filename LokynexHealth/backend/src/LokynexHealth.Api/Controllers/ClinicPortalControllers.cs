using LokynexHealth.Api.Security;
using LokynexHealth.Application.Clinics;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

// Everything a signed-in clinic account can do. "Clinic" policy = clinic tokens ONLY.
// [ClinicPermission(module, action)] then decides per module (admin passes everything).
// Every handler additionally filters by the clinic_id of the token.

[ApiController]
[Route("api/clinic")]
[Authorize(Policy = "Clinic")]
[ClinicPermission]
public class ClinicPortalController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicPortalController(IMediator mediator) => _mediator = mediator;

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct) => Ok(await _mediator.Send(new GetClinicMeQuery(), ct));

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct) => Ok(await _mediator.Send(new GetClinicDashboardQuery(), ct));

    [HttpPut("profile")]
    [ClinicPermission("admin")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateClinicProfileCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangeClinicPasswordCommand command, CancellationToken ct)
    {
        await _mediator.Send(command, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/clinic/users")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("users")]
public class ClinicUsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicUsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetClinicUsersQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("meta")]
    public async Task<IActionResult> Meta(CancellationToken ct) => Ok(await _mediator.Send(new GetClinicRolesMetaQuery(), ct));

    [HttpPost]
    [ClinicPermission("users", "create")]
    public async Task<IActionResult> Create([FromBody] CreateClinicUserCommand command, CancellationToken ct)
        => Ok(new { id = await _mediator.Send(command, ct) });

    [HttpPut("{id:guid}")]
    [ClinicPermission("users", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClinicUserCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [ClinicPermission("users", "edit")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetClinicUserStatusCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/reset-password")]
    [ClinicPermission("users", "edit")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetClinicUserPasswordCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ClinicPermission("users", "delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteClinicUserCommand { Id = id }, ct);
        return NoContent();
    }
}

/// <summary>Doctors are needed by Appointments and Prescriptions too, so listing is open to any
/// clinic account; changing doctors needs the "doctors" module.</summary>
[ApiController]
[Route("api/clinic/doctors")]
[Authorize(Policy = "Clinic")]
[ClinicPermission]
public class ClinicDoctorsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicDoctorsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetClinicDoctorsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost]
    [ClinicPermission("doctors", "create")]
    public async Task<IActionResult> Create([FromBody] SaveClinicDoctorCommand command, CancellationToken ct)
    {
        command.Id = null;
        return Ok(new { id = await _mediator.Send(command, ct) });
    }

    [HttpPut("{id:guid}")]
    [ClinicPermission("doctors", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveClinicDoctorCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/clinic")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("appointments")]
public class ClinicBookingController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicBookingController(IMediator mediator) => _mediator = mediator;

    [HttpGet("schedules")]
    public async Task<IActionResult> Schedules([FromQuery] GetClinicSchedulesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost("schedules")]
    [ClinicPermission("doctors", "create")]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateClinicScheduleCommand command, CancellationToken ct)
        => Ok(new { id = await _mediator.Send(command, ct) });

    [HttpPatch("schedules/{id:guid}/status")]
    [ClinicPermission("doctors", "edit")]
    public async Task<IActionResult> ToggleSchedule(Guid id, [FromBody] ToggleClinicScheduleCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> Slots([FromQuery] GetClinicSlotsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings([FromQuery] GetClinicBookingsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost("bookings")]
    [ClinicPermission("appointments", "create")]
    public async Task<IActionResult> Book([FromBody] BookClinicAppointmentCommand command, CancellationToken ct)
    {
        var res = await _mediator.Send(command, ct);
        return Ok(new { id = res.Id, serialNo = res.SerialNo });
    }

    [HttpPost("bookings/{id:guid}/cancel")]
    [ClinicPermission("appointments", "edit")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new CancelClinicBookingCommand { Id = id }, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/clinic/patients")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("patients")]
public class ClinicPatientsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicPatientsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] SearchClinicPatientsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id:guid}/history")]
    public async Task<IActionResult> History(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetClinicPatientHistoryQuery { Id = id }, ct));

    // Edit a saved patient. The signed-in username and the time are recorded.
    [HttpPut("{id:guid}")]
    [ClinicPermission("patients", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClinicPatientCommand command, CancellationToken ct)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command, ct));
    }
}

[ApiController]
[Route("api/clinic/medicines")]
[Authorize(Policy = "Clinic")]
public class ClinicMedicinesController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicMedicinesController(IMediator mediator) => _mediator = mediator;

    // The prescription editor needs these lookups, so "prescriptions" is enough (as is "medicines").
    [HttpGet("search")]
    [ClinicPermission("prescriptions", "create")]
    public async Task<IActionResult> Search([FromQuery] SearchClinicMedicinesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("companies")]
    [ClinicPermission("prescriptions", "create")]
    public async Task<IActionResult> Companies([FromQuery] GetClinicMedicineCompaniesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet]
    [ClinicPermission("medicines")]
    public async Task<IActionResult> GetAll([FromQuery] GetClinicMedicinesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost]
    [ClinicPermission("medicines", "create")]
    public async Task<IActionResult> Create([FromBody] SaveClinicMedicineCommand command, CancellationToken ct)
    {
        command.Id = null;
        return Ok(new { id = await _mediator.Send(command, ct) });
    }

    [HttpPut("{id:guid}")]
    [ClinicPermission("medicines", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveClinicMedicineCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ClinicPermission("medicines", "delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteClinicMedicineCommand { Id = id }, ct);
        return NoContent();
    }

    [HttpPost("import")]
    [ClinicPermission("medicines", "create")]
    public async Task<IActionResult> Import([FromBody] ImportClinicMedicinesCommand command, CancellationToken ct)
        => Ok(await _mediator.Send(command, ct));
}

/// <summary>Read-only view of the lab's department + test catalog for "Advise tests".</summary>
[ApiController]
[Route("api/clinic/tests")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("prescriptions", "create")]
public class ClinicTestCatalogController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicTestCatalogController(IMediator mediator) => _mediator = mediator;

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] SearchClinicTestsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("departments")]
    public async Task<IActionResult> Departments(CancellationToken ct)
        => Ok(await _mediator.Send(new GetClinicTestDepartmentsQuery(), ct));
}

[ApiController]
[Route("api/clinic/prescriptions")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("prescriptions")]
public class ClinicPrescriptionsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicPrescriptionsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetClinicPrescriptionsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetClinicPrescriptionQuery { Id = id }, ct));

    [HttpPost]
    [ClinicPermission("prescriptions", "create")]
    public async Task<IActionResult> Create([FromBody] SaveClinicPrescriptionCommand command, CancellationToken ct)
    {
        command.Id = null;
        return Ok(await _mediator.Send(command, ct));
    }

    [HttpPut("{id:guid}")]
    [ClinicPermission("prescriptions", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveClinicPrescriptionCommand command, CancellationToken ct)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command, ct));
    }

    [HttpDelete("{id:guid}")]
    [ClinicPermission("prescriptions", "delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteClinicPrescriptionCommand { Id = id }, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/clinic/ledger")]
[Authorize(Policy = "Clinic")]
[ClinicPermission("ledger")]
public class ClinicLedgerController : ControllerBase
{
    private readonly IMediator _mediator;
    public ClinicLedgerController(IMediator mediator) => _mediator = mediator;

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics([FromQuery] GetClinicLedgerAnalyticsQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("entries")]
    public async Task<IActionResult> Entries([FromQuery] GetClinicLedgerEntriesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpPost]
    [ClinicPermission("ledger", "create")]
    public async Task<IActionResult> Record([FromBody] RecordClinicLedgerEntryCommand command, CancellationToken ct)
        => Ok(new { id = await _mediator.Send(command, ct) });

    [HttpPut("{id:guid}")]
    [ClinicPermission("ledger", "edit")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClinicLedgerEntryCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ClinicPermission("ledger", "delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteClinicLedgerEntryCommand { Id = id }, ct);
        return NoContent();
    }
}