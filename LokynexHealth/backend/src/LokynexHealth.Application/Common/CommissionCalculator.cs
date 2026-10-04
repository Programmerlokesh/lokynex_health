using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Application.Common;

public static class CommissionCalculator
{
    /// <summary>Flat = the value itself, Percentage = % of the test price.</summary>
    public static decimal Calculate(CommissionType type, decimal value, decimal testPrice) =>
        type == CommissionType.Percentage
            ? Math.Round(testPrice * (value / 100m), 2, MidpointRounding.AwayFromZero)
            : value;
}