import Select, { SingleValue } from "react-select";
import { useFilters } from "../hooks/use-filters.ts";
import { useMapLinesOption } from "../hooks/use-map-lines-name.ts";
import { useGlobalStore } from "../store";
import { LEAFLET_PROVIDERS } from "../constants";

type Props = {
  onApply?: VoidFunction;
};

export function Filters({ onApply }: Props) {
  const { selectedFilters, handleChange, handleApply } = useFilters();
  const lines = useMapLinesOption();
  const currentLeafletProvider = useGlobalStore(
    (state) => state.leafletProvider
  );
  const setLeafletProvider = useGlobalStore(
    (state) => state.setLeafletProvider
  );

  const applyFilters = () => {
    onApply?.();
    handleApply();
  };

  return (
    <div className="vstack" style={{ gap: "1.7rem" }}>
      <div className="hstack">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
          width="20px"
          height="20px"
          fill="#1f1f1f"
        >
          <path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
        </svg>

        <h2 className="h4">Filters</h2>
      </div>

      <div className="vstack w-full">
        <div className="hstack">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            enableBackground="new 0 0 24 24"
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill="#6366F1"
          >
            <g>
              <rect fill="none" height="24" width="24" />
            </g>
            <g>
              <g>
                <path d="M19,15.18V7c0-2.21-1.79-4-4-4s-4,1.79-4,4v10c0,1.1-0.9,2-2,2s-2-0.9-2-2V8.82C8.16,8.4,9,7.3,9,6c0-1.66-1.34-3-3-3 S3,4.34,3,6c0,1.3,0.84,2.4,2,2.82V17c0,2.21,1.79,4,4,4s4-1.79,4-4V7c0-1.1,0.9-2,2-2s2,0.9,2,2v8.18c-1.16,0.41-2,1.51-2,2.82 c0,1.66,1.34,3,3,3s3-1.34,3-3C21,16.7,20.16,15.6,19,15.18z" />
              </g>
            </g>
          </svg>

          <span className="label">Lines</span>
        </div>

        <Select
          isMulti
          options={lines}
          value={selectedFilters.line}
          onChange={(value) => handleChange("line", value)}
          isSearchable={false}
          styles={{
            container: (provided) => ({
              ...provided,
              width: "100%",
            }),
          }}
        />
      </div>

      <div className="vstack w-full">
        <div className="hstack">
          <svg
            width="20"
            height="16"
            viewBox="0 0 20 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 3V12C20 12.71 19.62 13.36 19 13.72V15.25C19 15.66 18.66 16 18.25 16H17.75C17.34 16 17 15.66 17 15.25V14H10V15.25C10 15.66 9.66 16 9.25 16H8.75C8.34 16 8 15.66 8 15.25V13.72C7.39 13.36 7 12.71 7 12V3C7 0 10 0 13.5 0C17 0 20 0 20 3ZM11 11C11 10.45 10.55 10 10 10C9.45 10 9 10.45 9 11C9 11.55 9.45 12 10 12C10.55 12 11 11.55 11 11ZM18 11C18 10.45 17.55 10 17 10C16.45 10 16 10.45 16 11C16 11.55 16.45 12 17 12C17.55 12 18 11.55 18 11ZM18 3H9V7H18V3ZM5 5.5C4.97 4.12 3.83 3 2.45 3.05C1.07 3.08 -0.0299996 4.22 4.40981e-07 5.6C0.0300004 6.77 0.86 7.77 2 8V16H3V8C4.18 7.76 5 6.71 5 5.5Z"
              fill="#eab308"
            />
          </svg>

          <span className="label">Stops</span>
        </div>

        <Select
          options={stopFilters}
          value={selectedFilters.stop}
          onChange={(value: SingleValue<{ label: string; value: string }>) =>
            handleChange("stop", value)
          }
          isSearchable={false}
          styles={{
            container: (provided) => ({
              ...provided,
              width: "100%",
            }),
          }}
        />
      </div>

      <div className="vstack w-full">
        <div className="hstack">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            width="20"
            height="16"
            fill="#d946ef"
          >
            <path d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32c0 0 0 0 0 0l0-32s0 0 0 0l0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l112 0 0-160-112 0c-17.7 0-32 14.3-32 32zM304 288l112 0c17.7 0 32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-112 0 0 160zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z" />
          </svg>

          <span className="label">Buses</span>
        </div>

        <Select
          options={busFilters}
          value={selectedFilters.bus}
          onChange={(value: SingleValue<{ label: string; value: string }>) =>
            handleChange("bus", value)
          }
          isSearchable={false}
          styles={{
            container: (provided) => ({
              ...provided,
              width: "100%",
            }),
          }}
        />
      </div>

      <div className="vstack w-full">
        <div className="hstack">
          <svg
            id="Map_Marker_24"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#4AA9FF"
          >
            <rect
              width="24"
              height="24"
              stroke="none"
              fill="#000000"
              opacity="0"
            />

            <g transform="matrix(0.95 0 0 0.95 12 12)">
              <path
                stroke="none"
                strokeWidth={1}
                strokeDasharray="none"
                strokeDashoffset={0}
                strokeLinejoin="miter"
                strokeMiterlimit={4}
                fillRule="nonzero"
                opacity={1}
                transform="translate(-12.5, -10.5)"
                d="M 18 0 C 15.791 0 14 1.791 14 4 C 14 6.857 18 11 18 11 C 18 11 22 6.857 22 4 C 22 1.791 20.209 0 18 0 z M 18 2.5703125 C 18.789 2.5703125 19.429688 3.211 19.429688 4 C 19.429688 4.789 18.789 5.4296875 18 5.4296875 C 17.211 5.4296875 16.570312 4.789 16.570312 4 C 16.570312 3.211 17.211 2.5703125 18 2.5703125 z M 8.9707031 3 C 8.8542031 3.003375 8.7389062 3.0263125 8.6289062 3.0703125 L 3.6289062 5.0703125 C 3.2499062 5.2233125 3 5.591 3 6 L 3 20 C 3 20.707 3.7140937 21.191688 4.3710938 20.929688 L 9.03125 19.064453 L 14.683594 20.949219 C 14.907594 21.024219 15.151094 21.017688 15.371094 20.929688 L 20.371094 18.929688 C 20.751094 18.776688 21 18.409 21 18 L 21 10.585938 C 20.308 11.465937 19.6965 12.122625 19.4375 12.390625 L 18 13.878906 L 16.5625 12.390625 C 16.3035 12.122625 15.692 11.465937 15 10.585938 L 15 18.923828 L 14.96875 18.935547 L 9 16.945312 L 9 5.0761719 L 9.03125 5.0644531 L 12.427734 6.1953125 C 12.165734 5.4603125 12 4.718 12 4 C 12 3.982 12.003906 3.9652656 12.003906 3.9472656 L 9.3164062 3.0507812 C 9.2044062 3.0132812 9.0872031 2.996625 8.9707031 3 z"
                strokeLinecap="round"
              />
            </g>
          </svg>

          <span className="label">Map Layer</span>
        </div>

        <Select
          options={LEAFLET_PROVIDERS.map((provider) => ({
            label: provider.name,
            value: provider.id.toString(),
          }))}
          value={{
            label: currentLeafletProvider.name,
            value: currentLeafletProvider.id.toString(),
          }}
          onChange={(value: SingleValue<{ label: string; value: string }>) => {
            const provider = LEAFLET_PROVIDERS.find(
              (provider) => provider.id === Number(value?.value)
            );
            if (provider) {
              setLeafletProvider(provider);
            }
          }}
          isSearchable={false}
          styles={{
            container: (provided) => ({
              ...provided,
              width: "100%",
            }),
          }}
        />
      </div>

      <button className="w-full" onClick={applyFilters}>
        Apply
      </button>
    </div>
  );
}

const stopFilters = [
  { value: "all", label: "All" },
  { value: "none", label: "None" },
  { value: "line-only", label: "Line Only" },
];

const busFilters = [
  { value: "all", label: "All" },
  { value: "none", label: "None" },
  { value: "line-only", label: "Line Only" },
];
