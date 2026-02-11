const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto w-full max-w-[2520px] px-4 sm:px-6 md:px-10">
      {children}
    </div>
  );
};

export default Container;
