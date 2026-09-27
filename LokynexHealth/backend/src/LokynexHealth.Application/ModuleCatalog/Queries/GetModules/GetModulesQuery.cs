using MediatR;

namespace LokynexHealth.Application.ModuleCatalog.Queries.GetModules;

// Read-only lookup list — powers the permission grid (module x
// view/create/edit/delete) on Create/Edit User. LabAdmin-only.
public class GetModulesQuery : IRequest<List<ModuleListItemDto>>
{
}

public class ModuleListItemDto
{
    public short Id { get; set; }
    public string Name { get; set; } = default!;
}