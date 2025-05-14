import { deleteRelatedLineItemsWorkflow } from "../../../../../workflows/delete-related-items";

export const DELETE = async (req, res) => {
  const { id: cart_id } = req.params;
  const { line_item_id } = req.body;

  try {
    await deleteRelatedLineItemsWorkflow(req.scope).run({
      input: { cart_id, line_item_id },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /cart/:id/delete-related-items", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
