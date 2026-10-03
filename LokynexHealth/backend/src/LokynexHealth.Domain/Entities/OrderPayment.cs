using LokynexHealth.Domain.Enums;

namespace LokynexHealth.Domain.Entities;

/// <summary>One payment collected against an order (maps to order_payments).</summary>
public class OrderPayment
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = default!;
    public decimal Amount { get; set; }
    public PaymentMethodType PaymentMethod { get; set; }
    public DateTimeOffset PaidAt { get; set; }
    public Guid? ReceivedBy { get; set; }
}