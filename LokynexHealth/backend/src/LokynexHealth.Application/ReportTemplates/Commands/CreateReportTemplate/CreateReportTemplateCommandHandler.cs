using LokynexHealth.Application.Common.Interfaces;
using LokynexHealth.Domain.Entities;
using LokynexHealth.Domain.Enums;
using MediatR;

namespace LokynexHealth.Application.ReportTemplates.Commands.CreateReportTemplate;

public class CreateReportTemplateCommandHandler : IRequestHandler<CreateReportTemplateCommand, Guid>
{
    private readonly IApplicationDbContext _db;

    public CreateReportTemplateCommandHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateReportTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = new ReportTemplate
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            DepartmentId = request.DepartmentId,
            HeaderContent = request.HeaderContent,
            FooterContent = request.FooterContent,
            BodyContent = request.BodyContent,
            SourceType = Enum.Parse<ReportSourceType>(request.SourceType),
            OriginalFilePath = request.OriginalFilePath,
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.ReportTemplates.Add(template);
        await _db.SaveChangesAsync(cancellationToken);

        return template.Id;
    }
}