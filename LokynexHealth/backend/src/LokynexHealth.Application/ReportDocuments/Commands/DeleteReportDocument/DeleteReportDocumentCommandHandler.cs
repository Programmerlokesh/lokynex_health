using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Commands.DeleteReportDocument;

public class DeleteReportDocumentCommandHandler : IRequestHandler<DeleteReportDocumentCommand>
{
    private readonly IApplicationDbContext _db;

    public DeleteReportDocumentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(DeleteReportDocumentCommand request, CancellationToken cancellationToken)
    {
        var doc = await _db.ReportDocuments.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (doc is null)
            throw new NotFoundException(nameof(ReportDocument), request.Id);

        doc.IsDeleted = true;
        doc.DeletedAt = DateTimeOffset.UtcNow;
        doc.DeletedBy = request.DeletedBy;

        await _db.SaveChangesAsync(cancellationToken);
    }
}