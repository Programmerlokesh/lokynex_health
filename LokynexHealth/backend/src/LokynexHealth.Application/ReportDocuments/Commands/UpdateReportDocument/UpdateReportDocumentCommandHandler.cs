using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Commands.UpdateReportDocument;

public class UpdateReportDocumentCommandHandler : IRequestHandler<UpdateReportDocumentCommand>
{
    private readonly IApplicationDbContext _db;

    public UpdateReportDocumentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task Handle(UpdateReportDocumentCommand request, CancellationToken cancellationToken)
    {
        var doc = await _db.ReportDocuments.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (doc is null)
            throw new NotFoundException(nameof(ReportDocument), request.Id);

        doc.HeaderContent = request.HeaderContent;
        doc.FooterContent = request.FooterContent;
        doc.BodyContent = request.BodyContent;
        doc.UpdatedBy = request.UpdatedBy;
        doc.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}