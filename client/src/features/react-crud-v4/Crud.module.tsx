import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const CrudPage = lazy(() => import("./Crud.page"));

const CrudModule = () => {
  return (
    <Suspense fallback={<div aria-live="polite">Loading...</div>}>
      <Routes>
        <Route index element={<CrudPage />} />
      </Routes>
    </Suspense>
  );
};

export default CrudModule;
