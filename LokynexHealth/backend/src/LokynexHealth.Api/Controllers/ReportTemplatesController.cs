using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportTemplates.Commands.CreateReportTemplate;
using LokynexHealth.Application.ReportTemplates.Commands.DeleteReportTemplate;
using LokynexHealth.Application.ReportTemplates.Queries.GetReportTemplates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportTemplatesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReportTemplatesController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReportTemplateCommand command, CancellationToken ct)
    {
        command.CreatedBy = _currentUser.UserId;
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Create), new { id }, new { id });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetReportTemplatesQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteReportTemplateCommand { Id = id, DeletedBy = _currentUser.UserId ?? Guid.Empty }, ct);
        return NoContent();
    }
}