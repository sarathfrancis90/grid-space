export function SpreadsheetLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      data-testid="spreadsheet-loader"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading spreadsheet...</p>
      </div>
    </div>
  );
}
