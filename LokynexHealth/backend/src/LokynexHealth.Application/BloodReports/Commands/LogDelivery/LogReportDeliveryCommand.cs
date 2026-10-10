using FluentValidation;
using LokynexHealth.Application.Common.Exceptions;
using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LokynexHealth.Application.BloodReports.Commands.LogDelivery;

public class LogReportDeliveryCommand : IRequest
{
    public Guid DocumentId { get; set; }
    public Guid? DeliveredBy { get; set; }
    public string Channel { get; set; } = default!;   // Print | Download | WhatsApp
    public string? SentTo { get; set; }
    public string? Status { get; set; }               // Queued | Done | Failed
    public string? ErrorMessage { get; set; }
}

public class LogReportDeliveryCommandValidator : AbstractValidator<LogReportDeliveryCommand>
{
    public LogReportDeliveryCommandValidator()
    {
        RuleFor(x => x.DocumentId).NotEmpty();
        RuleFor(x => x.Channel).Must(c => c is "Print" or "Download" or "WhatsApp")
            .WithMessage("Channel must be Print, Download or WhatsApp.");
        RuleFor(x => x.SentTo).MaximumLength(20);
    }
}

public class LogReportDeliveryCommandHandler : IRequestHandler<LogReportDeliveryCommand>
{
    private readonly IApplicationDbContext _db;
    public LogReportDeliveryCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task Handle(LogReportDeliveryCommand request, CancellationToken ct)
    {
        var doc = await _db.ReportDocuments.FirstOrDefaultAsync(d => d.Id == request.DocumentId, ct)
            ?? throw new NotFoundException(nameof(ReportDocument), request.DocumentId);

        Guid? userId = null;
        if (request.DeliveredBy is Guid uid && await _db.Users.AnyAsync(u => u.Id == uid, ct))
            userId = uid;

        var now = DateTimeOffset.UtcNow;
        var status = request.Status is "Queued" or "Failed" ? request.Status : "Done";

        _db.ReportDeliveries.Add(new ReportDelivery
        {
            Id = Guid.NewGuid(),
            ReportDocumentId = doc.Id,
            Channel = request.Channel,
            SentTo = request.SentTo,
            Status = status,
            ErrorMessage = request.ErrorMessage,
            DeliveredBy = userId,
            DeliveredAt = now
        });

        if (request.Channel == "Download") doc.PdfGeneratedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}