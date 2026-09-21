using MediatR;

namespace LokynexHealth.Application.Labs.Queries.GetLabById;

public class GetLabByIdQuery : IRequest<LabDetailDto>
{
    public Guid Id { get; set; }
}