using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Application.ReportDocuments.Commands.DeleteReportDocument;
using LokynexHealth.Application.ReportDocuments.Commands.GenerateReportDocument;
using LokynexHealth.Application.ReportDocuments.Commands.UpdateReportDocument;
using LokynexHealth.Application.ReportDocuments.Queries.GetReportDocuments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LokynexHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportDocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReportDocumentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateReportDocumentCommand command, CancellationToken ct)
    {
        command.CreatedBy = _currentUser.UserId;
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(Generate), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReportDocumentCommand command, CancellationToken ct)
    {
        command.Id = id;
        command.UpdatedBy = _currentUser.UserId;
        await _mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteReportDocumentCommand { Id = id, DeletedBy = _currentUser.UserId ?? Guid.Empty }, ct);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetReportDocumentsQuery query, CancellationToken ct)
    {
        var result = await _mediator.Send(query, ct);
        return Ok(result);
    }
}