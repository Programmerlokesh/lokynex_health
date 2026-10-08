using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.ReportDocuments.Commands.CreateReportDocument;

public class CreateReportDocumentCommandHandler : IRequestHandler<CreateReportDocumentCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateReportDocumentCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateReportDocumentCommand request, CancellationToken ct)
    {
        var item = await _db.OrderItems
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == request.OrderItemId, ct)
            ?? throw new NotFoundException(nameof(OrderItem), request.OrderItemId);

        if (item.Order.IsDeleted)
            throw new ConflictException("This order is deleted, so a report cannot be created.");

        var doc = new ReportDocument
        {
            Id = Guid.NewGuid(),
            OrderItemId = item.Id,
            HeaderContent = request.HeaderContent,
            BodyContent = request.BodyContent,
            FooterContent = request.FooterContent,
            SourceType = Enum.Parse<ReportSourceType>(request.SourceType),
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.ReportDocuments.Add(doc);
        item.ReportStatus = ReportStatusType.Uploaded;

        await _db.SaveChangesAsync(ct);
        return doc.Id;
    }
}