import React from 'react';

const SavedRoutes: React.FC = () => {
  const savedRoutes = [
    {
      id: 1,
      title: "Route to Central Park",
      start: "123 Elm Street",
      end: "456 Oak Avenue",
      savedDate: "July 15, 2024",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQoV1nh8ivongGNWSWm7Q0JfUn6U0MCybDU68qUuNl175DUzru26WptsF8l4IryBgSlqTI1OaXKsMOKg1NHwHsCuL0oGxtC8ONd7z3CIK99-lWa47ekBqeIOeAeGwLZwsVfK77fM3s0TBb1O3-u3wJlPUEG9LgyFZgxJprb7OYdmo8PpIVLm3kR1fvgwYP3Oa4V_H-9-lSbLkyFoB9210SkFc9tnLy8wemVQvrx8peHpgMX6r0DUmGcv6QHzMISzwCjDGecdYPuy0"
    },
    {
      id: 2,
      title: "Route to the Library",
      start: "789 Pine Lane",
      end: "101 Maple Drive",
      savedDate: "June 22, 2024",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCauqO13P0wmlGl1Gmv_5VsR0IhNisBl5c2TgPrkui103K9S6My9XsHsqe6_tro5T7DuGOGND65GvVbwW97K7VivKEgTDUotZEjJQo5MKPwIXpKvRdrKF8f0tMhX_03AOpxQecmLOhN1ERufGjwS99IbwTY3egZq96BaF1iGEylFIeQSTHACjWlZ5-RtGtfIClyLUf0QlhHPbJEDKL_DlMSe_nqMR38exykuCsZ-PbCQdet1qUVpd0MKR-XNbIUQOlgZruS4lmG1dk"
    },
    {
      id: 3,
      title: "Route to the Museum",
      start: "222 Cedar Road",
      end: "333 Birch Court",
      savedDate: "May 10, 2024",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLJPsTxWOjXpCoQpetcXDLJN88PmHRjAKJYTGEWu5yIJ0LWOwHXuoS6bLGUpol1TkPxplRewTolAWfKi9svJxff_FcJw1g7TNAf0YWea2zC9zdC92Ss9UujMn1l-4tSYBV3vv5_B4T9lgoeYH3nMLbuUqUwbZHYPxZsD1LjF6ZNfSJlaI6TJcpVtu0ptxrPkmARyvVHHWwKXvObatNiewaFQFml73dGk4xCISx8GMv_WcjpyvNBQRDLs08VuY3d_9WrJEh0Wv47hw"
    },
    {
      id: 4,
      title: "Route to the Shopping Mall",
      start: "444 Willow Place",
      end: "555 Aspen Way",
      savedDate: "April 5, 2024",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnvgrwOQe1l0E0aR4aULQDD83suxYE9bcQPxZv4OoWBPpr1lmInpz-GxNdkDYg7qja6Si0WX97HllnZP6vKrAByirus5O1ZZLoTkL6YPZ4oGkTXa-sKI9nkHdeVLoamLXGjj1YyfV_tfFA32NIhP8UEO-ina_CaKd9H5Umc2T6AvMUMY9T-RrRLdG7JujC_4wdvFG7ANWPBBnJ5lTfc9if-hkOhn1MxNZmmYUdg2Hg17GAhCTbV72SucO7YIyNTW22YnRWz5E-jPw"
    },
    {
      id: 5,
      title: "Route to the Community Center",
      start: "666 Spruce Street",
      end: "777 Fir Avenue",
      savedDate: "March 1, 2024",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnsdHIDxpNmBtj3mEkkxbm14oumelQ2f3kn0HIs76rpDHeK0J2MdIkjajswYK08L9h3wNZSYE8Z2--x-mVkr2c2_iCaQe6kZ2zyt0jmCluEtpNpeOD_pMJP9w0uU7kRdCUPVPVTUjpo-bk1W8Z_v6ytLqSHJHfCAlMwbUDtRfZXOXsjKPgwnaZg2qVVcf0B3O29GFEffKqw6VmQuSSRlxEJGtG_AiqeZtr72-YijBAcN_p9AoHM-R245A5E3zPjc91ZBHR_ZjDVkk"
    }
  ];

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Saved Routes</h2>
      <div className="space-y-4">
        {savedRoutes.map((route) => (
          <div
            key={route.id}
            className="group relative flex items-center gap-4 bg-white p-4 rounded-md border border-gray-200 hover:shadow-md hover:border-[var(--primary-color)] transition-all duration-300"
          >
            <div className="flex-shrink-0">
              <div
                className="bg-center bg-no-repeat aspect-video bg-cover rounded-md h-24 w-40"
                style={{ backgroundImage: `url("${route.imageUrl}")` }}
              ></div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">{route.title}</p>
              <p className="text-sm text-gray-500 mt-1">Start: {route.start}, End: {route.end}</p>
              <p className="text-xs text-gray-400 mt-2">Saved on: {route.savedDate}</p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                View Details
              </button>
              <button className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors">
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedRoutes;
