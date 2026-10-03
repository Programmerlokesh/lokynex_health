using LokynexHealth.Application.Tests.Commands.CreateTest;
using LokynexHealth.Application.Tests.Commands.UpdateTest;
using LokynexHealth.Application.Tests.Queries.GetTestCommissions;
using LokynexHealth.Application.Tests.Queries.GetTests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TestsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTestCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return StatusCode(StatusCodes.Status201Created, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? departmentId,
        [FromQuery] string? search,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new GetTestsQuery
        {
            DepartmentId = departmentId,
            Search = search,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTestCommand command, CancellationToken ct)
    {
        command.Id = id;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    /// <summary>Person-specific (doctor / referral / technician) commissions of one test.</summary>
    [HttpGet("{id}/commissions")]
    public async Task<IActionResult> GetCommissions(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTestCommissionsQuery { TestId = id }, ct);
        return Ok(result);
    }
}