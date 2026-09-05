namespace LokynexHealth.Domain.Entities;

public class Module
{
    public short Id { get; set; }   // SMALLINT ↔ short
    public string Name { get; set; } = default!;
}