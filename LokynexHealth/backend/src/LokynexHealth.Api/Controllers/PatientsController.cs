using LokynexHealth.Application.Patients.Queries.SearchPatients;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PatientsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>GET /api/Patients/search?phone=98300 — guardian + family members.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] SearchPatientsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }
}