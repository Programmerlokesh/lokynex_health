using LokynexHealth.Application.TestFormats.Commands.SaveTestFormat;
using LokynexHealth.Application.TestFormats.Queries.GetTestFormat;
using LokynexHealth.Application.TestFormats.Queries.GetTestFormats;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestFormatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TestFormatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // All active tests + how many parameters each one has
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTestFormatsQuery { Search = search }, ct);
        return Ok(result);
    }

    // Full format of one test (parameters + ranges + machine / reagent defaults)
    [HttpGet("{testId:guid}")]
    public async Task<IActionResult> GetOne(Guid testId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetTestFormatQuery { TestId = testId }, ct);
        return Ok(result);
    }

    // Replace the whole format of one test
    [HttpPut("{testId:guid}")]
    public async Task<IActionResult> Save(Guid testId, [FromBody] SaveTestFormatCommand command, CancellationToken ct)
    {
        command.TestId = testId;
        await _mediator.Send(command, ct);
        return NoContent();
    }
}