using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportTemplates.Commands.DeleteReportTemplate;

public class DeleteReportTemplateCommandHandler : IRequestHandler<DeleteReportTemplateCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteReportTemplateCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteReportTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await _db.ReportTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(ReportTemplate), request.Id);

        template.IsDeleted = true;
        template.DeletedAt = DateTimeOffset.UtcNow;
        template.DeletedBy = request.DeletedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}